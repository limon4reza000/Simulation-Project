/**
 * Adds Chapter 7 — তরঙ্গ ও শব্দ (Waves and Sound) — to an already-seeded
 * database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter6.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 186–209 — see
 * docs/content/physics-9-10-chapter-07.md.
 *
 * Run: npx tsx scripts/seedChapter7.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 7 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'তরঙ্গ ও শব্দ',
      titleEn: 'Waves and Sound',
      displayOrder: 7,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'সপ্তম অধ্যায় — তরঙ্গ ও শব্দ', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'সপ্তম অধ্যায় — তরঙ্গ ও শব্দ',
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

  console.log('Seeding Chapter 7 — তরঙ্গ ও শব্দ (Waves and Sound)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'সরল দোলকের পর্যায়কাল',
    topicTitleEn: "A Simple Pendulum's Period",
    lessonTitleBn: 'সরল দোলকের পর্যায়কাল',
    lessonTitleEn: "A Simple Pendulum's Period",
    prosePage: 188,
    proseBn:
      'সরল দোলকের পর্যায়কাল T = 2π√(l/g), যেখানে l দোলকের দৈর্ঘ্য এবং g অভিকর্ষজ ত্বরণ। লক্ষণীয় বিষয়, এই সূত্রে দোলকের সাথে যুক্ত ভরের কোনো উল্লেখ নেই — হালকা হোক বা ভারী, একই দৈর্ঘ্যের দুটি দোলকের পর্যায়কাল সবসময় সমান।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_PENDULUM_PERIOD',
          configuration: { maxLengthM: 3 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'lengthM',
                labelBn: 'দৈর্ঘ্য (l)',
                labelEn: 'Length (l)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0.1',
                maxValue: '3',
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
    topicTitleBn: 'তরঙ্গ-সংশ্লিষ্ট রাশি',
    topicTitleEn: 'Wave-related Quantities',
    lessonTitleBn: 'তরঙ্গ-সংশ্লিষ্ট রাশি',
    lessonTitleEn: 'Wave-related Quantities',
    prosePage: 195,
    proseBn:
      'তরঙ্গের বেগ v = fλ, যেখানে f কম্পাঙ্ক এবং λ তরঙ্গদৈর্ঘ্য। একটি তরঙ্গের অবস্থান-ভিত্তিক লেখচিত্র থেকে বিস্তার ও তরঙ্গদৈর্ঘ্য জানা যায়, আর সময়-ভিত্তিক লেখচিত্র থেকে বিস্তার ও পর্যায়কাল জানা যায়। দুটো মিলিয়েই কম্পাঙ্ক এবং বেগ বের করা সম্ভব হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_WAVE_PROPERTIES',
          configuration: { maxAmplitudeM: 0.3, maxWavelengthM: 3, maxPeriodS: 1 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'amplitudeM',
                labelBn: 'বিস্তার (a)',
                labelEn: 'Amplitude (a)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '0.1',
                minValue: '0.01',
                maxValue: '0.3',
              },
              {
                name: 'wavelengthM',
                labelBn: 'তরঙ্গদৈর্ঘ্য (λ)',
                labelEn: 'Wavelength (λ)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0.1',
                maxValue: '3',
              },
              {
                name: 'periodS',
                labelBn: 'পর্যায়কাল (T)',
                labelEn: 'Period (T)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '0.2',
                minValue: '0.05',
                maxValue: '1',
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
    topicTitleBn: 'শব্দের বেগের পার্থক্য',
    topicTitleEn: 'Variation of Sound Speed',
    lessonTitleBn: 'শব্দের বেগের পার্থক্য',
    lessonTitleEn: 'Variation of Sound Speed',
    prosePage: 202,
    proseBn:
      'বাতাসে শব্দের বেগ তাপমাত্রার (কেলভিন স্কেলে) বর্গমূলের সমানুপাতিক — v ∝ √T। শব্দের বেগ মাধ্যমের প্রকৃতির ওপরও নির্ভর করে: বায়বীয় মাধ্যমে বেগ সবচেয়ে কম, তরলে তার চেয়ে বেশি, কঠিন পদার্থে সবচেয়ে বেশি — কারণ কঠিন পদার্থের স্থিতিস্থাপকতা সবচেয়ে বেশি।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_SOUND_SPEED',
          configuration: { minTempC: -20, maxTempC: 50 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'tempC',
                labelBn: 'তাপমাত্রা (T)',
                labelEn: 'Temperature (T)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '30',
                minValue: '-20',
                maxValue: '50',
              },
              {
                name: 'mediumKey',
                labelBn: 'মাধ্যম',
                labelEn: 'Medium',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'air',
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
    topicTitleBn: 'প্রতিধ্বনি',
    topicTitleEn: 'Echo',
    lessonTitleBn: 'প্রতিধ্বনি',
    lessonTitleEn: 'Echo',
    prosePage: 201,
    proseBn:
      'কোনো শব্দ প্রতিফলিত হয়ে ফিরে এলে সেটি যদি মূল শব্দ থেকে আলাদাভাবে শোনা যায়, তাহলে তাকে প্রতিধ্বনি বলে। আমাদের কান একটি শব্দ প্রায় ০.১ সেকেন্ড ধরে রাখে, তাই দুটো শব্দ আলাদাভাবে শুনতে হলে তাদের মাঝে কমপক্ষে ০.১ সেকেন্ডের ব্যবধান দরকার। শব্দের বেগ ৩৩০ m/s হলে এর জন্য প্রতিফলক ন্যূনতম ১৬.৫ মিটার দূরে থাকতে হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ECHO',
          configuration: { maxDistanceM: 50, speedMs: 330 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'distanceM',
                labelBn: 'দেয়াল থেকে দূরত্ব (d)',
                labelEn: 'Distance to wall (d)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '20',
                minValue: '1',
                maxValue: '50',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 7 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
