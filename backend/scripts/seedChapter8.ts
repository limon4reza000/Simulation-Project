/**
 * Adds Chapter 8 — আলোর প্রতিফলন (Reflection of Light) — to an
 * already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter7.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 210–242 — see
 * docs/content/physics-9-10-chapter-08.md.
 *
 * Run: npx tsx scripts/seedChapter8.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 8 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'আলোর প্রতিফলন',
      titleEn: 'Reflection of Light',
      displayOrder: 8,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'অষ্টম অধ্যায় — আলোর প্রতিফলন', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'অষ্টম অধ্যায় — আলোর প্রতিফলন',
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

  console.log('Seeding Chapter 8 — আলোর প্রতিফলন (Reflection of Light)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'প্রতিফলনের সূত্র',
    topicTitleEn: 'The Law of Reflection',
    lessonTitleBn: 'প্রতিফলনের সূত্র',
    lessonTitleEn: 'The Law of Reflection',
    prosePage: 215,
    proseBn:
      'আপতিত রশ্মি, অভিলম্ব এবং প্রতিফলিত রশ্মি — তিনটিই একই সমতলে থাকে, এটাই প্রতিফলনের প্রথম সূত্র। দ্বিতীয় সূত্র অনুযায়ী প্রতিফলন কোণ সব সময় আপতন কোণের সমান হয়। এই দুটি সূত্র মেনেই আলো যেকোনো প্রতিফলক তলে প্রতিফলিত হয়, তল মসৃণ হোক বা অমসৃণ।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_LAW_OF_REFLECTION',
          configuration: { maxAngleDeg: 80 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'angleOfIncidenceDeg',
                labelBn: 'আপতন কোণ (θi)',
                labelEn: 'Angle of incidence (θi)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '40',
                minValue: '0',
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
    topicOrder: 2,
    topicTitleBn: 'সমতল আয়নায় প্রতিবিম্ব',
    topicTitleEn: 'Image in a Plane Mirror',
    lessonTitleBn: 'সমতল আয়নায় প্রতিবিম্ব',
    lessonTitleEn: 'Image in a Plane Mirror',
    prosePage: 221,
    proseBn:
      'সমতল আয়নায় তৈরি প্রতিবিম্ব আয়না থেকে ঠিক ততটুকুই দূরে থাকে যতটুকু দূরে বস্তুটি থাকে, প্রতিবিম্বটি অবাস্তব, সোজা এবং বস্তুর সমান আকারের হয়। মজার বিষয় হলো, পূর্ণদৈর্ঘ্য প্রতিবিম্ব দেখতে একজন মানুষের উচ্চতার অর্ধেক দৈর্ঘ্যের আয়নাই যথেষ্ট — আয়না থেকে সে যত দূরেই দাঁড়াক না কেন।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_PLANE_MIRROR_IMAGE',
          configuration: { maxDistanceM: 5, maxHeightM: 2.2 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'objectDistanceM',
                labelBn: 'বস্তুর দূরত্ব',
                labelEn: 'Object distance',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '2',
                minValue: '0.2',
                maxValue: '5',
              },
              {
                name: 'viewerHeightM',
                labelBn: 'দর্শকের উচ্চতা',
                labelEn: "Viewer's height",
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1.5',
                minValue: '0.5',
                maxValue: '2.2',
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
    topicTitleBn: 'গোলীয় আয়নায় প্রতিবিম্ব',
    topicTitleEn: 'Image in a Spherical Mirror',
    lessonTitleBn: 'গোলীয় আয়নায় প্রতিবিম্ব',
    lessonTitleEn: 'Image in a Spherical Mirror',
    prosePage: 232,
    proseBn:
      'উত্তল আয়নায় প্রতিবিম্ব সব সময়ই অবাস্তব, সোজা এবং খর্বিত হয় — বস্তুর অবস্থান যাই হোক না কেন। অবতল আয়নায় প্রতিবিম্বের প্রকৃতি বস্তুর অবস্থানের ওপর নির্ভর করে: ফোকাস দূরত্বের বাইরে রাখলে বাস্তব ও উল্টো প্রতিবিম্ব হয়, ফোকাস দূরত্বের ভেতরে রাখলে অবাস্তব, সোজা এবং বিবর্ধিত প্রতিবিম্ব হয়, আর ঠিক ফোকাস বিন্দুতে রাখলে কোনো প্রতিবিম্বই তৈরি হয় না।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_SPHERICAL_MIRROR',
          configuration: { radiusM: 4, maxObjectDistanceM: 12 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'mirrorType',
                labelBn: 'আয়নার ধরন',
                labelEn: 'Mirror type',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'concave',
              },
              {
                name: 'objectDistanceM',
                labelBn: 'বস্তুর দূরত্ব (u)',
                labelEn: 'Object distance (u)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '3',
                minValue: '0.1',
                maxValue: '12',
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
    topicTitleBn: 'দর্পণ সূত্র ও বিবর্ধন',
    topicTitleEn: 'Mirror Formula and Magnification',
    lessonTitleBn: 'দর্পণ সূত্র ও বিবর্ধন',
    lessonTitleEn: 'Mirror Formula and Magnification',
    prosePage: 233,
    proseBn:
      'গোলীয় আয়নার জন্য একটিমাত্র সূত্র ব্যবহার করে বস্তুর দূরত্ব, প্রতিবিম্বের দূরত্ব এবং ফোকাস দূরত্বের মধ্যে সম্পর্ক বের করা যায়: ১/u + ১/v = ১/f। প্রতিবিম্ব মূল বস্তু থেকে কত গুণ বড় বা ছোট সেটাই বিবর্ধন, m = প্রতিবিম্বের আকার / বস্তুর আকার।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_MIRROR_FORMULA',
          configuration: { maxObjectDistanceM: 20, maxFocalLengthM: 10 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'objectDistanceM',
                labelBn: 'বস্তুর দূরত্ব (u)',
                labelEn: 'Object distance (u)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '6',
                minValue: '0.1',
                maxValue: '20',
              },
              {
                name: 'focalLengthM',
                labelBn: 'ফোকাস দূরত্ব (f)',
                labelEn: 'Focal length (f)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '2',
                minValue: '-10',
                maxValue: '10',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 8 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
