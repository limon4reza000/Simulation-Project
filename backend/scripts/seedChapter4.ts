/**
 * Adds Chapter 4 — কাজ, ক্ষমতা ও শক্তি (Work, Power and Energy) — to an
 * already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts and
 * seedChapter3.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 98–126 — see
 * docs/content/physics-9-10-chapter-04.md.
 *
 * Run: npx tsx scripts/seedChapter4.ts
 */

import {
  PrismaClient,
  ContentStatus,
  Language,
  ComponentType,
  ValidationStatus,
  ParameterDataType,
  type Prisma,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const physics = await prisma.subject.findUniqueOrThrow({
    where: { code: 'PHY' },
  })
  const textbook = await prisma.textbook.findFirstOrThrow({
    where: { subjectId: physics.id },
  })
  const author = await prisma.user.findUniqueOrThrow({
    where: { email: 'author@example.local' },
  })

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 4 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'কাজ, ক্ষমতা ও শক্তি',
      titleEn: 'Work, Power and Energy',
      displayOrder: 4,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'চতুর্থ অধ্যায় — কাজ, ক্ষমতা ও শক্তি', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'চতুর্থ অধ্যায় — কাজ, ক্ষমতা ও শক্তি',
        pageStart: page,
        pageEnd: page,
      },
    })
    return created.id
  }

  async function publishedProse(bodyBn: string, page: number) {
    const content = await prisma.learningContent.create({
      data: { contentType: 'EXPLANATION', status: ContentStatus.PUBLISHED },
    })
    const version = await prisma.contentVersion.create({
      data: {
        contentId: content.id,
        versionNo: 1,
        language: Language.BN,
        body: bodyBn,
        createdById: author.id,
        publishedForLanguage: Language.BN,
      },
    })
    await prisma.contentValidation.create({
      data: {
        contentVersionId: version.id,
        textbookReferenceId: await referenceFor(page),
        validatorUserId: author.id,
        status: ValidationStatus.APPROVED,
        validationDate: new Date(),
        notes: `Verified against book page ${page}.`,
      },
    })
    return content
  }

  interface LessonSpec {
    topicOrder: number
    topicTitleBn: string
    topicTitleEn: string
    lessonTitleBn: string
    lessonTitleEn: string
    proseBn: string
    prosePage: number
    makeArtefact: () => Promise<{ id: number; isSimulation: boolean }>
  }

  async function ensureLesson(spec: LessonSpec) {
    const topic = await prisma.topic.upsert({
      where: { chapterId_displayOrder: { chapterId: chapter.id, displayOrder: spec.topicOrder } },
      update: {},
      create: {
        chapterId: chapter.id,
        titleBn: spec.topicTitleBn,
        titleEn: spec.topicTitleEn,
        displayOrder: spec.topicOrder,
        status: ContentStatus.PUBLISHED,
      },
    })

    const existing = await prisma.lesson.findUnique({
      where: { topicId_displayOrder: { topicId: topic.id, displayOrder: 1 } },
    })
    if (existing) {
      console.log(`  already seeded: ${spec.lessonTitleEn} (lesson ${existing.id})`)
      return
    }

    const artefact = await spec.makeArtefact()
    const content = await publishedProse(spec.proseBn, spec.prosePage)

    const lesson = await prisma.lesson.create({
      data: {
        topicId: topic.id,
        titleBn: spec.lessonTitleBn,
        titleEn: spec.lessonTitleEn,
        displayOrder: 1,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })

    const componentData: Prisma.LessonComponentCreateManyInput[] = [
      {
        lessonId: lesson.id,
        componentType: ComponentType.EXPLANATION,
        displayOrder: 1,
        contentId: content.id,
      },
      {
        lessonId: lesson.id,
        componentType: artefact.isSimulation
          ? ComponentType.SIMULATION
          : ComponentType.VISUALIZATION,
        displayOrder: 2,
        ...(artefact.isSimulation
          ? { simulationId: artefact.id }
          : { visualizationId: artefact.id }),
      },
    ]
    await prisma.lessonComponent.createMany({ data: componentData })

    console.log(`  seeded: ${spec.lessonTitleEn} (lesson ${lesson.id})`)
  }

  console.log('Seeding Chapter 4 — কাজ, ক্ষমতা ও শক্তি (Work, Power and Energy)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'কাজ',
    topicTitleEn: 'Work',
    lessonTitleBn: 'কাজ',
    lessonTitleEn: 'Work',
    prosePage: 100,
    proseBn:
      'কোনো বস্তুর উপর যদি F বল প্রয়োগ করা হয় এবং বল প্রয়োগ করার সময়টুকুতে যদি বস্তুটি বলের দিকে s দূরত্ব অতিক্রম করে, তাহলে ঐ বল দিয়ে করা কাজের পরিমাণ W = Fs। কাজ ধনাত্মক বা ঋণাত্মক হতে পারে — বল যদি সরণের দিকে কাজ করে তাহলে কাজ ধনাত্মক, বল যদি সরণের বিপরীত দিকে কাজ করে (যেমন ঘর্ষণ) তাহলে কাজ ঋণাত্মক।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_WORK',
          configuration: { maxForce: 200, maxFriction: 50, maxDisplacement: 20 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'forceN',
                labelBn: 'বল (F)',
                labelEn: 'Force (F)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '100',
                minValue: '0',
                maxValue: '200',
              },
              {
                name: 'frictionN',
                labelBn: 'ঘর্ষণ বল (f)',
                labelEn: 'Friction (f)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0',
                maxValue: '50',
              },
              {
                name: 'displacementM',
                labelBn: 'সরণ (s)',
                labelEn: 'Displacement (s)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0',
                maxValue: '20',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 2,
    topicTitleBn: 'গতিশক্তি ও বিভব শক্তির রূপান্তর',
    topicTitleEn: 'Kinetic–Potential Energy Conversion',
    lessonTitleBn: 'গতিশক্তি ও বিভব শক্তির রূপান্তর',
    lessonTitleEn: 'Kinetic–Potential Energy Conversion',
    prosePage: 109,
    proseBn:
      'কোনো বস্তুকে উপরের দিকে ছুড়ে দিলে তার গতিশক্তি ক্রমশ বিভব শক্তিতে রূপান্তরিত হয়, সর্বোচ্চ বিন্দুতে বেগ শূন্য হয় বলে সম্পূর্ণ গতিশক্তিই তখন বিভব শক্তিতে পরিণত হয়। ½mu² = mgh ব্যবহার করে দেখা যায় v² = 2gh — এই একই সম্পর্ক আগে গতির সমীকরণ দিয়েও পাওয়া গিয়েছিল, শক্তির ধারণা দিয়ে সম্পূর্ণ ভিন্নভাবে একই সূত্র আবার পাওয়া গেল।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ENERGY_CONVERSION',
          configuration: { maxLaunchSpeed: 30 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'massKg',
                labelBn: 'ভর (m)',
                labelEn: 'Mass (m)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '2',
                minValue: '1',
                maxValue: '20',
              },
              {
                name: 'launchSpeedMs',
                labelBn: 'নিক্ষেপ বেগ (u)',
                labelEn: 'Launch speed (u)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '20',
                minValue: '1',
                maxValue: '30',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 3,
    topicTitleBn: 'শক্তির নিত্যতা: দোলক',
    topicTitleEn: 'Conservation of Energy: Pendulum',
    lessonTitleBn: 'শক্তির নিত্যতা: দোলক',
    lessonTitleEn: 'Conservation of Energy: Pendulum',
    prosePage: 114,
    proseBn:
      'একটি পেন্ডুলাম দুলতে থাকলে তার গতিশক্তি এবং বিভবশক্তি বাড়লেও কমলেও মোট শক্তির পরিমাণ নির্দিষ্ট থাকে। সর্বোচ্চ কোণে বেগ শূন্য বলে সম্পূর্ণ শক্তিই বিভব শক্তি, সবচেয়ে নিচের বিন্দুতে বিভব শক্তি শূন্য বলে সম্পূর্ণ শক্তিই গতিশক্তি। ঘর্ষণ ও অন্যান্য কারণে শক্তি ক্ষয় না হলে এই প্রক্রিয়াটি অনন্তকাল ধরে চলতে থাকত।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_PENDULUM_ENERGY',
          configuration: { lengthM: 1 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'massKg',
                labelBn: 'ভর (m)',
                labelEn: 'Mass (m)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0.5',
                maxValue: '10',
              },
              {
                name: 'amplitudeDeg',
                labelBn: 'সর্বোচ্চ কোণ (θ₀)',
                labelEn: 'Amplitude (θ₀)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '40',
                minValue: '10',
                maxValue: '80',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 4,
    topicTitleBn: 'ক্ষমতা ও কর্মদক্ষতা',
    topicTitleEn: 'Power and Efficiency',
    lessonTitleBn: 'ক্ষমতা ও কর্মদক্ষতা',
    lessonTitleEn: 'Power and Efficiency',
    prosePage: 121,
    proseBn:
      'ক্ষমতা হচ্ছে কাজ করার হার, P = W/t। একটি মোটর যে হারে শক্তি ব্যবহার করে তার সবটুকু কখনোই কার্যকর কাজে রূপান্তরিত হয় না, কিছুটা সব সময়ই অপচয় হয়। কর্মদক্ষতা হচ্ছে কাজের পরিমাণ এবং প্রদত্ত শক্তির অনুপাত, শতকরা হিসেবে প্রকাশ করা হয়: কর্মদক্ষতা = (কাজের পরিমাণ / প্রদত্ত শক্তি) × ১০০%।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_POWER_EFFICIENCY',
          configuration: { maxPowerW: 2000, maxTimeS: 30, maxMassKg: 200, maxHeightM: 20 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'motorPowerW',
                labelBn: 'মোটরের ক্ষমতা',
                labelEn: "Motor's rated power",
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1000',
                minValue: '100',
                maxValue: '2000',
              },
              {
                name: 'timeS',
                labelBn: 'সময় (t)',
                labelEn: 'Time (t)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '15',
                minValue: '1',
                maxValue: '30',
              },
              {
                name: 'massKg',
                labelBn: 'ভর (m)',
                labelEn: 'Mass (m)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '100',
                minValue: '1',
                maxValue: '200',
              },
              {
                name: 'heightM',
                labelBn: 'উচ্চতা (h)',
                labelEn: 'Height (h)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0',
                maxValue: '20',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 4 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
