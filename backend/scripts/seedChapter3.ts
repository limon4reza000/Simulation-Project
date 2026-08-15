/**
 * Adds Chapter 3 — বল (Force) — to an already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts:
 * idempotency is checked per lesson at (topicId, displayOrder), so this can be
 * re-run safely as more lessons are added to it later.
 *
 * Content traced to book p. 74, §৩.৫ সংঘর্ষ (Collision) and §৩.৫.১ ভরবেগ ও
 * শক্তির সংরক্ষণশীলতা — see docs/content/physics-9-10-chapter-03.md.
 *
 * Run: npx tsx scripts/seedChapter3.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 3 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'বল',
      titleEn: 'Force',
      displayOrder: 3,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'তৃতীয় অধ্যায় — বল', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'তৃতীয় অধ্যায় — বল',
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

  console.log('Seeding Chapter 3 — বল (Force)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'সংঘর্ষ',
    topicTitleEn: 'Collision',
    lessonTitleBn: 'সংঘর্ষ',
    lessonTitleEn: 'Collision',
    prosePage: 74,
    proseBn:
      'দুটি বস্তু মুখোমুখি সংঘর্ষে জড়ালে, বাইরে থেকে কোনো বল প্রয়োগ না হলে তাদের মোট ভরবেগ অপরিবর্তিত থাকে — এটি ভরবেগের নিত্যতার সূত্র। ভারী ট্রাক ও হালকা গাড়ির সংঘর্ষে গাড়ির ভর ট্রাকের তুলনায় খুব কম হলে ট্রাকের বেগ প্রায় অপরিবর্তিত থাকে, কিন্তু গাড়ি আসার বেগের তিনগুণ বেগে উল্টো দিকে ছিটকে যায়। এ কারণেই ভারী যানবাহন সতর্কতার সাথে চালাতে হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_COLLISION',
          configuration: { maxMass1: 5000, maxMass2: 2000, maxSpeed: 20 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'mass1',
                labelBn: 'ট্রাক (m১)',
                labelEn: 'Truck (m1)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '5000',
                minValue: '200',
                maxValue: '5000',
              },
              {
                name: 'mass2',
                labelBn: 'গাড়ি (m২)',
                labelEn: 'Car (m2)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '50',
                minValue: '10',
                maxValue: '2000',
              },
              {
                name: 'speed',
                labelBn: 'বেগ',
                labelEn: 'Speed',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '1',
                maxValue: '20',
              },
              {
                name: 'elastic',
                labelBn: 'স্থিতিস্থাপক সংঘর্ষ',
                labelEn: 'Elastic collision',
                dataType: ParameterDataType.BOOLEAN,
                defaultValue: 'true',
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
    topicTitleBn: 'নিউটনের দ্বিতীয় গতি সূত্র',
    topicTitleEn: "Newton's Second Law",
    lessonTitleBn: 'নিউটনের দ্বিতীয় গতি সূত্র',
    lessonTitleEn: "Newton's Second Law",
    prosePage: 76,
    proseBn:
      'বস্তুর ভরবেগের পরিবর্তনের হার তার উপর প্রযুক্ত বলের সমানুপাতিক — এটাই নিউটনের দ্বিতীয় গতি সূত্র। সমানুপাতিক ধ্রুবক ১ ধরে নিলে সূত্রটি একটি সমীকরণ হিসেবে লেখা যায়: F = ma। অর্থাৎ একই বল বেশি ভরের বস্তুর উপর প্রয়োগ করলে ত্বরণ কম হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_NEWTONS_SECOND_LAW',
          configuration: { maxForce: 50, maxMass: 20, durationS: 4 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'forceN',
                labelBn: 'বল',
                labelEn: 'Force',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0',
                maxValue: '50',
              },
              {
                name: 'massKg',
                labelBn: 'ভর',
                labelEn: 'Mass',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '2',
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
    topicOrder: 3,
    topicTitleBn: 'স্থিতি ঘর্ষণ সহগ পরিমাপ',
    topicTitleEn: 'Measuring the Coefficient of Static Friction',
    lessonTitleBn: 'স্থিতি ঘর্ষণ সহগ পরিমাপ',
    lessonTitleEn: 'Measuring the Coefficient of Static Friction',
    prosePage: 91,
    proseBn:
      'একটি বইয়ের উপর একটি ম্যাচ বাক্স রেখে বইটি আস্তে আস্তে ঢালু করলে, একটি নির্দিষ্ট কোণে (সংকট কোণ) ম্যাচ বাক্সটি পিছলাতে শুরু করে। সেই কোণেই স্থিতি ঘর্ষণ সহগ μs এর মান হয় tan θc — কারণ ঠিক সেই মুহূর্তে অভিকর্ষজ বলের ঢাল বরাবর উপাংশ সর্বোচ্চ স্থিতি ঘর্ষণ বলের সমান হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_FRICTION_INCLINE',
          configuration: { staticCoefficient: 0.4, kineticCoefficient: 0.3 },
          status: ContentStatus.PUBLISHED,
          parameters: { create: [] },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 4,
    topicTitleBn: 'বলের সাম্যাবস্থা ও অসাম্যাবস্থা',
    topicTitleEn: 'Balanced and Unbalanced Forces',
    lessonTitleBn: 'বলের সাম্যাবস্থা ও অসাম্যাবস্থা',
    lessonTitleEn: 'Balanced and Unbalanced Forces',
    prosePage: 69,
    proseBn:
      'বল একটি ভেক্টর রাশি। একটি বস্তুর উপর দুই বা ততোধিক বল প্রয়োগ করা হলে সেগুলোর সম্মিলিত লব্ধি যদি শূন্য হয়, তাহলে বস্তুটির ত্বরণ থাকে না — একে সাম্যাবস্থা বলে। লব্ধি শূন্য না হলে সেটি অসাম্যাবস্থা, আর তখন বস্তুটি লব্ধি বলের দিকে ত্বরিত হয়।',
    makeArtefact: async () => {
      const viz = await prisma.visualization.create({
        data: {
          type: 'VIZ_FORCE_BALANCE',
          configuration: { forceCount: 3 },
          status: ContentStatus.PUBLISHED,
        },
      })
      return { id: viz.id, isSimulation: false }
    },
  })

  console.log('Chapter 3 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
