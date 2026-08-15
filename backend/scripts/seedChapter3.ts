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
