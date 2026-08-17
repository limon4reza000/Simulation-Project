/**
 * Adds Chapter 11 — চল বিদ্যুৎ (Current Electricity) — to an already-seeded
 * database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter10.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 298–330 — see
 * docs/content/physics-9-10-chapter-11.md.
 *
 * Run: npx tsx scripts/seedChapter11.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 11 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'চল বিদ্যুৎ',
      titleEn: 'Current Electricity',
      displayOrder: 11,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'একাদশ অধ্যায় — চল বিদ্যুৎ', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'একাদশ অধ্যায় — চল বিদ্যুৎ',
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

  console.log('Seeding Chapter 11 — চল বিদ্যুৎ (Current Electricity)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: "ও'মের সূত্র",
    topicTitleEn: "Ohm's Law",
    lessonTitleBn: "ও'মের সূত্র",
    lessonTitleEn: "Ohm's Law",
    prosePage: 305,
    proseBn:
      'পরীক্ষা করে দেখা যায়, নির্দিষ্ট তাপমাত্রায় কোনো পরিবাহীর দুই প্রান্তের বিভব পার্থক্য V এবং তার ভেতর দিয়ে প্রবাহিত বিদ্যুৎ I সরাসরি সমানুপাতিক — I ∝ V। এই সমানুপাতিক ধ্রুবককে বিপরীত করে রোধ R হিসেবে লিখলে সূত্রটি দাঁড়ায় I = V/R, যা ও\'মের সূত্র নামে পরিচিত।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_OHMS_LAW',
          configuration: { maxVoltageV: 12, maxResistanceOhm: 20 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'voltageV',
                labelBn: 'বিভব পার্থক্য (V)',
                labelEn: 'Voltage (V)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '6',
                minValue: '0',
                maxValue: '12',
              },
              {
                name: 'resistanceOhm',
                labelBn: 'রোধ (R)',
                labelEn: 'Resistance (R)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '3',
                minValue: '1',
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
    topicTitleBn: 'তারের রোধ',
    topicTitleEn: "A Wire's Resistance",
    lessonTitleBn: 'তারের রোধ',
    lessonTitleEn: "A Wire's Resistance",
    prosePage: 306,
    proseBn:
      'কোনো তারের রোধ তার দৈর্ঘ্যের সমানুপাতিক এবং প্রস্থচ্ছেদের ক্ষেত্রফলের ব্যস্তানুপাতিক। এই দুই সম্পর্ককে একটি সমীকরণে লিখলে R = ρL/A, যেখানে ρ (রো) উপাদানের নিজস্ব ধর্ম — আপেক্ষিক রোধ। বিভিন্ন ধাতুর আপেক্ষিক রোধ ভিন্ন হয়, তাই একই দৈর্ঘ্য ও পুরুত্বের তার বিভিন্ন ধাতুর জন্য ভিন্ন রোধ দেখায়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_WIRE_RESISTANCE',
          configuration: { maxLengthM: 5, radiusM: 0.0001 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'materialKey',
                labelBn: 'উপাদান',
                labelEn: 'Material',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'copper',
              },
              {
                name: 'lengthM',
                labelBn: 'দৈর্ঘ্য (L)',
                labelEn: 'Length (L)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1.84',
                minValue: '0.01',
                maxValue: '5',
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
    topicTitleBn: 'শ্রেণি ও সমান্তরাল বর্তনী',
    topicTitleEn: 'Series and Parallel Circuits',
    lessonTitleBn: 'শ্রেণি ও সমান্তরাল বর্তনী',
    lessonTitleEn: 'Series and Parallel Circuits',
    prosePage: 315,
    proseBn:
      'একাধিক রোধ পরপর (শ্রেণিতে) যুক্ত থাকলে একই বিদ্যুৎ সবগুলোর ভেতর দিয়ে প্রবাহিত হয়, তাই তুল্য রোধ R = R১+R২+...+Rₙ। রোধগুলো সমান্তরালে যুক্ত থাকলে প্রতিটির দুই প্রান্তে একই বিভব পার্থক্য থাকে কিন্তু বিদ্যুৎ ভাগ হয়ে যায়, তাই তুল্য রোধ 1/R = 1/R১+1/R২+...+1/Rₙ — যা সবসময় ক্ষুদ্রতম রোধের চেয়েও কম।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_SERIES_PARALLEL_CIRCUIT',
          configuration: { maxVoltageV: 12, maxResistanceOhm: 20 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'mode',
                labelBn: 'সংযোগের ধরন',
                labelEn: 'Connection type',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'series',
              },
              {
                name: 'voltageV',
                labelBn: 'বিভব পার্থক্য (V)',
                labelEn: 'Voltage (V)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '6',
                minValue: '0.5',
                maxValue: '12',
              },
              {
                name: 'r1',
                labelBn: 'রোধ R১',
                labelEn: 'Resistor R1',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '5',
                minValue: '1',
                maxValue: '20',
              },
              {
                name: 'r2',
                labelBn: 'রোধ R২',
                labelEn: 'Resistor R2',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '1',
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
    topicOrder: 4,
    topicTitleBn: 'তড়িৎ ক্ষমতা ও বিদ্যুৎ বিল',
    topicTitleEn: 'Electric Power and Electricity Bill',
    lessonTitleBn: 'তড়িৎ ক্ষমতা ও বিদ্যুৎ বিল',
    lessonTitleEn: 'Electric Power and Electricity Bill',
    prosePage: 319,
    proseBn:
      'তড়িৎ ক্ষমতা P = VI = I²R = V²/R। কোনো যন্ত্র যদি P ওয়াট ক্ষমতায় t ঘণ্টা চলে, তাহলে তার ব্যয়িত শক্তি (ইউনিট বা kWh) = (P×t)/১০০০। প্রতি ইউনিটের নির্দিষ্ট মূল্য দিয়ে গুণ করলে মোট বিদ্যুৎ বিল পাওয়া যায়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ELECTRIC_POWER',
          configuration: { maxPowerW: 2000, maxHoursPerDay: 24, maxDays: 31 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'powerW',
                labelBn: 'ক্ষমতা (P)',
                labelEn: 'Power (P)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '60',
                minValue: '1',
                maxValue: '2000',
              },
              {
                name: 'hoursPerDay',
                labelBn: 'দৈনিক ব্যবহার',
                labelEn: 'Hours per day',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '5',
                minValue: '0',
                maxValue: '24',
              },
              {
                name: 'days',
                labelBn: 'দিনসংখ্যা',
                labelEn: 'Days',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '30',
                minValue: '1',
                maxValue: '31',
              },
              {
                name: 'takaPerUnit',
                labelBn: 'প্রতি ইউনিটের মূল্য',
                labelEn: 'Price per unit',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '1',
                maxValue: '20',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 11 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
