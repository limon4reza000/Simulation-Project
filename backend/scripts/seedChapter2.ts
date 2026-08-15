/**
 * Adds Chapter 2 — গতি (Motion) — to an already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only. prisma/seed.ts guards its content block
 * with "skip everything if a textbook already exists" (see the note there),
 * which was the right call for a single chapter but means a second chapter
 * can never be added by re-running it. This is a separate script with its own
 * idempotency, checked per lesson rather than once at the top: each call to
 * ensureLesson() looks for a Lesson at its (topicId, displayOrder) key and
 * skips content creation entirely if found, so the script can be re-run
 * freely — including after a later run adds more lessons than an earlier one
 * did, which a single top-level guard could not have supported.
 *
 * Reuses the existing Physics subject, class links and textbook row rather
 * than creating new ones. Content traced to book pp. 39, 48–56, §২.৪
 * দূরত্ব ও সরণ, §২.৮ পড়ন্ত বস্তুর সূত্র, and গতি ও লেখচিত্র / অনুসন্ধান ২.০১ —
 * see docs/content/physics-9-10-chapter-02.md.
 *
 * Run: npx tsx scripts/seedChapter2.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 2 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'গতি',
      titleEn: 'Motion',
      displayOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  })

  // One reference per cited page. Created fresh each run only for pages not
  // already referenced under this chapter, so re-running does not pile up
  // duplicate TextbookReference rows for the same page.
  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'দ্বিতীয় অধ্যায় — গতি', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'দ্বিতীয় অধ্যায় — গতি',
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
    // §14.4: publication requires an APPROVED validation naming a source page.
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
    /** Creates the Simulation/Visualization row and returns its id + kind. */
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

  console.log('Seeding Chapter 2 — গতি (Motion)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'পড়ন্ত বস্তুর সূত্র',
    topicTitleEn: 'Laws of Falling Bodies',
    lessonTitleBn: 'পড়ন্ত বস্তুর সূত্র',
    lessonTitleEn: 'Laws of Falling Bodies',
    prosePage: 48,
    proseBn:
      'বিনা বাধায় পড়ন্ত বস্তুর ক্ষেত্রে গ্যালিলিও তিনটি সূত্র দিয়েছিলেন: একই উচ্চতা থেকে সব বস্তু একই সময়ে পড়ে, বেগ সময়ের সমানুপাতিক (v ∝ t), এবং অতিক্রান্ত দূরত্ব সময়ের বর্গের সমানুপাতিক (h ∝ t²)।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_FREE_FALL',
          configuration: { maxHeightM: 40 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'heightM',
                labelBn: 'উচ্চতা',
                labelEn: 'Height',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '20',
                minValue: '2',
                maxValue: '40',
                stepValue: '0.5',
              },
              {
                name: 'compareMass',
                labelBn: 'দুই ভর তুলনা',
                labelEn: 'Compare two masses',
                dataType: ParameterDataType.BOOLEAN,
                defaultValue: 'false',
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
    topicTitleBn: 'দূরত্ব ও সরণ',
    topicTitleEn: 'Distance and Displacement',
    lessonTitleBn: 'দূরত্ব ও সরণ',
    lessonTitleEn: 'Distance and Displacement',
    prosePage: 39,
    proseBn:
      'দূরত্ব একটি স্কেলার রাশি — কোনো বস্তু যে পথ ধরে চলেছে তার মোট দৈর্ঘ্য। সরণ একটি ভেক্টর রাশি — শুরুর অবস্থান থেকে শেষ অবস্থান পর্যন্ত সরলরৈখিক দূরত্ব ও দিক। আঁকাবাঁকা পথে বেশি দূরত্ব অতিক্রম করেও সরণ কম হতে পারে।',
    makeArtefact: async () => {
      const viz = await prisma.visualization.create({
        data: {
          type: 'VIZ_DISTANCE_DISPLACEMENT',
          configuration: { table: 'চিত্র ২.০৪' },
          status: ContentStatus.PUBLISHED,
        },
      })
      return { id: viz.id, isSimulation: false }
    },
  })

  await ensureLesson({
    topicOrder: 3,
    topicTitleBn: 'অনুসন্ধান: ঢালু তলের পরীক্ষা',
    topicTitleEn: 'Investigation: Inclined Plane',
    lessonTitleBn: 'ঢালু তলের পরীক্ষা',
    lessonTitleEn: 'Inclined Plane Investigation',
    prosePage: 54,
    proseBn:
      'বিভিন্ন ঢালে অতিক্রান্ত একই দূরত্বের জন্য দ্রুতি বের করে লেখচিত্রের সাহায্যে ঢালের সাথে সম্পর্ক বের করা যায়। ঢালু তলের উচ্চতা h এবং দৈর্ঘ্য L হলে sin θ = h/L।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_INCLINED_PLANE',
          configuration: { maxHeightM: 4, maxLengthM: 8 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'heightM',
                labelBn: 'উচ্চতা',
                labelEn: 'Height',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1.5',
                minValue: '0.5',
                maxValue: '4',
                stepValue: '0.1',
              },
              {
                name: 'lengthM',
                labelBn: 'ঢালের দৈর্ঘ্য',
                labelEn: 'Ramp length',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '6',
                minValue: '2',
                maxValue: '8',
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
    topicTitleBn: 'গতি ও লেখচিত্র',
    topicTitleEn: 'Motion and Graphs',
    lessonTitleBn: 'গতি ও লেখচিত্র',
    lessonTitleEn: 'Motion and Graphs',
    prosePage: 51,
    proseBn:
      'দূরত্ব-সময় লেখচিত্র থেকে ধারাবাহিক দুটি পাঠের মাঝামাঝি সময়ে বেগ বের করা যায়, আর বেগ-সময় লেখচিত্র থেকে একইভাবে ত্বরণ। এভাবে একটিমাত্র দূরত্ব-সময় সারণি থেকে তিনটি লেখচিত্রই আঁকা সম্ভব।',
    makeArtefact: async () => {
      const viz = await prisma.visualization.create({
        data: {
          type: 'VIZ_MOTION_GRAPHER',
          configuration: { table: 'টেবিল ২.০১', dataset: 'set1' },
          status: ContentStatus.PUBLISHED,
        },
      })
      return { id: viz.id, isSimulation: false }
    },
  })

  console.log('Chapter 2 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
