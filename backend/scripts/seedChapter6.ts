/**
 * Adds Chapter 6 — বস্তুর ওপর তাপের প্রভাব (Effects of Heat on Matter) — to an
 * already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter5.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 159–185 — see
 * docs/content/physics-9-10-chapter-06.md.
 *
 * Run: npx tsx scripts/seedChapter6.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 6 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'বস্তুর ওপর তাপের প্রভাব',
      titleEn: 'Effects of Heat on Matter',
      displayOrder: 6,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'ষষ্ঠ অধ্যায় — বস্তুর ওপর তাপের প্রভাব', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'ষষ্ঠ অধ্যায় — বস্তুর ওপর তাপের প্রভাব',
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

  console.log('Seeding Chapter 6 — বস্তুর ওপর তাপের প্রভাব (Effects of Heat on Matter)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'তাপমাত্রার স্কেল',
    topicTitleEn: 'Temperature Scales',
    lessonTitleBn: 'তাপমাত্রার স্কেল',
    lessonTitleEn: 'Temperature Scales',
    prosePage: 165,
    proseBn:
      'সেলসিয়াস, কেলভিন এবং ফারেনহাইট — তাপমাত্রার তিনটি প্রচলিত স্কেল। এদের মধ্যে সম্পর্ক: Tc/100 = (Tk-273.15)/100 = (Tf-32)/180। কেলভিন স্কেল পরম শূন্য তাপমাত্রাকে শূন্য ধরে তৈরি — এর চেয়ে কম তাপমাত্রা সম্ভব নয়। সেলসিয়াস ও কেলভিন স্কেল কখনো সমান হয় না, কারণ তারা একটি স্থির যোজক ধ্রুবক দ্বারা পৃথক।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_TEMPERATURE_SCALES',
          configuration: { minC: -273.15, maxC: 600 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'celsius',
                labelBn: 'সেলসিয়াস (°C)',
                labelEn: 'Celsius (°C)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '25',
                minValue: '-273.15',
                maxValue: '600',
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
    topicTitleBn: 'কঠিন পদার্থের প্রসারণ',
    topicTitleEn: 'Thermal Expansion of a Solid',
    lessonTitleBn: 'কঠিন পদার্থের প্রসারণ',
    lessonTitleEn: 'Thermal Expansion of a Solid',
    prosePage: 168,
    proseBn:
      'তাপ দিলে কঠিন পদার্থের দৈর্ঘ্য, ক্ষেত্রফল ও আয়তন — তিনটিই বেড়ে যায়। দৈর্ঘ্য প্রসারণ সহগ α থেকে ক্ষেত্রফল প্রসারণ সহগ β = 2α এবং আয়তন প্রসারণ সহগ γ = 3α সরাসরি পাওয়া যায় — আলাদা করে পরিমাপ করার দরকার হয় না, কারণ α এর মান এত ছোট যে α² ও α³ সহ পদগুলো উপেক্ষা করা যায়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_THERMAL_EXPANSION',
          configuration: { initialLengthM: 10, maxTempC: 500 },
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
                name: 'tempC',
                labelBn: 'তাপমাত্রা (T)',
                labelEn: 'Temperature (T)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '120',
                minValue: '20',
                maxValue: '500',
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
    topicTitleBn: 'গলন ও বাষ্পীভবন',
    topicTitleEn: 'Melting and Boiling',
    lessonTitleBn: 'গলন ও বাষ্পীভবন',
    lessonTitleEn: 'Melting and Boiling',
    prosePage: 176,
    proseBn:
      'কঠিন পদার্থকে তাপ দিলে একটি নির্দিষ্ট তাপমাত্রায় (গলনাঙ্ক) গলন শুরু হয়। গলন চলাকালে তাপ দেওয়া সত্ত্বেও তাপমাত্রা বাড়ে না — এই তাপ আণবিক বন্ধন শিথিল করতে ব্যয় হয়, একে গলনের সুপ্ততাপ বলে। একইভাবে স্ফুটনাঙ্কে তরল থেকে গ্যাসে রূপান্তরের সময় তাপমাত্রা স্থির থাকে — একে বাষ্পীভবনের সুপ্ততাপ বলে।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_HEATING_CURVE',
          configuration: { massKg: 1 },
          status: ContentStatus.PUBLISHED,
          parameters: { create: [] },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 4,
    topicTitleBn: 'ক্যালোরিমিতির মূলনীতি',
    topicTitleEn: 'Principle of Calorimetry',
    lessonTitleBn: 'ক্যালোরিমিতির মূলনীতি',
    lessonTitleEn: 'Principle of Calorimetry',
    prosePage: 179,
    proseBn:
      'দুটি ভিন্ন তাপমাত্রার বস্তু স্পর্শে এলে বেশি তাপমাত্রার বস্তু কম তাপমাত্রার বস্তুর কাছে তাপ দিতে থাকে যতক্ষণ না দুটোর তাপমাত্রা সমান হয়। উত্তপ্ত বস্তু যতটুকু তাপ পরিত্যাগ করে, শীতল বস্তু ঠিক ততটুকু তাপ গ্রহণ করে — এটাই ক্যালোরিমিতির মূলনীতি, যা ধরে নেয় প্রক্রিয়ায় কোনো তাপ নষ্ট হচ্ছে না।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_CALORIMETRY',
          configuration: { maxMassKg: 5, maxTempC: 150 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'massAKg',
                labelBn: 'ভর (বস্তু ক)',
                labelEn: 'Mass (Body A)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '2',
                minValue: '0.01',
                maxValue: '5',
              },
              {
                name: 'tempAC',
                labelBn: 'তাপমাত্রা (বস্তু ক)',
                labelEn: 'Temperature (Body A)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '75',
                minValue: '0',
                maxValue: '150',
              },
              {
                name: 'massBKg',
                labelBn: 'ভর (বস্তু খ)',
                labelEn: 'Mass (Body B)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0.01',
                maxValue: '5',
              },
              {
                name: 'tempBC',
                labelBn: 'তাপমাত্রা (বস্তু খ)',
                labelEn: 'Temperature (Body B)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '20',
                minValue: '0',
                maxValue: '150',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 6 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
