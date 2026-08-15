/**
 * Adds Chapter 5 — পদার্থের অবস্থা ও চাপ (State of Matter and Pressure) — to
 * an already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter4.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 127–158 — see
 * docs/content/physics-9-10-chapter-05.md.
 *
 * Run: npx tsx scripts/seedChapter5.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 5 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'পদার্থের অবস্থা ও চাপ',
      titleEn: 'State of Matter and Pressure',
      displayOrder: 5,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'পঞ্চম অধ্যায় — পদার্থের অবস্থা ও চাপ', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'পঞ্চম অধ্যায় — পদার্থের অবস্থা ও চাপ',
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

  console.log('Seeding Chapter 5 — পদার্থের অবস্থা ও চাপ (State of Matter and Pressure)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'চাপ',
    topicTitleEn: 'Pressure',
    lessonTitleBn: 'চাপ',
    lessonTitleEn: 'Pressure',
    prosePage: 129,
    proseBn:
      'কোনো বস্তুর উপর F বল প্রয়োগ করলে এবং সেই বল A ক্ষেত্রফলের উপর প্রয়োগ করা হলে চাপ P = F/A। একই বল বড় ক্ষেত্রফলে ছড়িয়ে দিলে চাপ কমে যায়, ছোট ক্ষেত্রফলে প্রয়োগ করলে চাপ বেড়ে যায়। চাপ একটি স্কেলার রাশি — বলের মতো এর কোনো দিক নেই।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_PRESSURE',
          configuration: { maxMassKg: 100, minAreaM2: 0.01, maxAreaM2: 0.6 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'massKg',
                labelBn: 'ভর (m)',
                labelEn: 'Mass (m)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '50',
                minValue: '1',
                maxValue: '100',
              },
              {
                name: 'areaM2',
                labelBn: 'সংস্পর্শ ক্ষেত্রফল (A)',
                labelEn: 'Contact area (A)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '0.03',
                minValue: '0.01',
                maxValue: '0.6',
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
    topicTitleBn: 'তরলের ভেতর চাপ',
    topicTitleEn: 'Pressure in a Liquid',
    lessonTitleBn: 'তরলের ভেতর চাপ',
    lessonTitleEn: 'Pressure in a Liquid',
    prosePage: 134,
    proseBn:
      'তরলের h গভীরতায় চাপ P = hρg, যেখানে ρ তরলের ঘনত্ব এবং g অভিকর্ষজ ত্বরণ। নির্দিষ্ট ঘনত্বের তরলে গভীরতার সাথে সাথে চাপ সমানুপাতিকভাবে বাড়ে। পানির ক্ষেত্রে প্রতি ১০ মিটার গভীরতায় প্রায় ১ atm চাপ বেড়ে যায় — এ কারণেই গভীর সমুদ্রের প্রাণী ও ডুবুরিদের অনেক বেশি চাপ সহ্য করতে হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_LIQUID_PRESSURE',
          configuration: { maxDepthM: 3000 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'depthM',
                labelBn: 'গভীরতা (h)',
                labelEn: 'Depth (h)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '500',
                minValue: '0',
                maxValue: '3000',
              },
              {
                name: 'liquidKey',
                labelBn: 'তরল',
                labelEn: 'Liquid',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'water',
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
    topicTitleBn: 'প্লবতা ও ভাসা-ডোবা',
    topicTitleEn: 'Buoyancy: Floating and Sinking',
    lessonTitleBn: 'প্লবতা ও ভাসা-ডোবা',
    lessonTitleEn: 'Buoyancy: Floating and Sinking',
    prosePage: 138,
    proseBn:
      'কোনো বস্তু তরলে নিমজ্জিত করলে সেটি যে পরিমাণ তরল অপসারণ করে সেইটুকু তরলের সমান ওজন বস্তুটির ওজন থেকে কমে যায় — এটি আর্কিমিডিসের নীতি। ভাসন্ত বস্তুর ডুবন্ত অংশের আয়তন এমনভাবে নির্ধারিত হয় যেন অপসারিত তরলের ওজন বস্তুর ওজনের সমান হয়, অর্থাৎ ডুবন্ত অংশ = বস্তুর ঘনত্ব ÷ তরলের ঘনত্ব।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ARCHIMEDES',
          configuration: { maxObjectDensity: 2000 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'objectDensityKgM3',
                labelBn: "বস্তুর ঘনত্ব",
                labelEn: "Object's density",
                dataType: ParameterDataType.FLOAT,
                defaultValue: '500',
                minValue: '100',
                maxValue: '2000',
              },
              {
                name: 'fluidKey',
                labelBn: 'তরল',
                labelEn: 'Fluid',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'water',
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
    topicTitleBn: 'স্থিতিস্থাপকতা ও হুকের সূত্র',
    topicTitleEn: "Elasticity and Hooke's Law",
    lessonTitleBn: 'স্থিতিস্থাপকতা ও হুকের সূত্র',
    lessonTitleEn: "Elasticity and Hooke's Law",
    prosePage: 148,
    proseBn:
      'বাইরে থেকে বল প্রয়োগ করলে পদার্থের আকার বা দৈর্ঘ্যের যে আপেক্ষিক পরিবর্তন হয় সেটাই বিকৃতি, এবং একক ক্ষেত্রফলে বিকৃতির কারণে পদার্থের ভেতরে যে বল তৈরি হয় সেটাই পীড়ন। স্থিতিস্থাপক সীমার ভেতরে পীড়ন ও বিকৃতি সমানুপাতিক — এটাই হুকের সূত্র। সীমা অতিক্রম করলে পদার্থ আর তার আগের অবস্থায় ফিরে আসে না।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_HOOKES_LAW',
          configuration: { maxMassKg: 5 },
          status: ContentStatus.PUBLISHED,
          parameters: { create: [] },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 5 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
