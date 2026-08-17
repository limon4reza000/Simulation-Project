/**
 * Adds Chapter 12 — বিদ্যুতের চৌম্বক ক্রিয়া (Magnetic Effects of Current) — to
 * an already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter11.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 331–346 — see
 * docs/content/physics-9-10-chapter-12.md.
 *
 * Run: npx tsx scripts/seedChapter12.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 12 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'বিদ্যুতের চৌম্বক ক্রিয়া',
      titleEn: 'Magnetic Effects of Current',
      displayOrder: 12,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'দ্বাদশ অধ্যায় — বিদ্যুতের চৌম্বক ক্রিয়া', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'দ্বাদশ অধ্যায় — বিদ্যুতের চৌম্বক ক্রিয়া',
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

  console.log('Seeding Chapter 12 — বিদ্যুতের চৌম্বক ক্রিয়া (Magnetic Effects of Current)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'ডান হাতের নিয়ম',
    topicTitleEn: 'The Right-Hand Grip Rule',
    lessonTitleBn: 'ডান হাতের নিয়ম',
    lessonTitleEn: 'The Right-Hand Grip Rule',
    prosePage: 333,
    proseBn:
      'কোনো তারের ভেতর দিয়ে বিদ্যুৎ প্রবাহিত হলে তার চারপাশে একটি চৌম্বক ক্ষেত্র তৈরি হয়। এই চৌম্বক ক্ষেত্রের দিক নির্ণয়ের জন্য ডান হাতের নিয়ম ব্যবহার করা হয়: ডান হাতের বুড়ো আঙুল বিদ্যুৎপ্রবাহের দিক বরাবর রাখলে, বাকি আঙুলগুলো বাঁকিয়ে ধরলে সেগুলো চৌম্বক ক্ষেত্রের দিক নির্দেশ করে। বিদ্যুৎপ্রবাহের দিক পাল্টালে চৌম্বক ক্ষেত্রের দিকও পাল্টে যায়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_MAGNETIC_FIELD_DIRECTION',
          configuration: {},
          status: ContentStatus.PUBLISHED,
          parameters: { create: [] },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 2,
    topicTitleBn: 'তাড়িতচুম্বকের শক্তি',
    topicTitleEn: "An Electromagnet's Strength",
    lessonTitleBn: 'তাড়িতচুম্বকের শক্তি',
    lessonTitleEn: "An Electromagnet's Strength",
    prosePage: 335,
    proseBn:
      'একটি কুণ্ডলীর ভেতর লোহার টুকরা রেখে তার ভেতর দিয়ে বিদ্যুৎ প্রবাহিত করলে তৈরি হওয়া চৌম্বক ক্ষেত্র লোহার নিজস্ব চৌম্বক ক্ষেত্রের সাথে যুক্ত হয়ে অনেক শক্তিশালী চৌম্বক ক্ষেত্র তৈরি করে — একে তাড়িতচুম্বক বলে। বিদ্যুৎপ্রবাহ যত বেশি হবে, চৌম্বক ক্ষেত্র তত শক্তিশালী হবে। কুণ্ডলীর প্যাঁচসংখ্যা বাড়ালেও একইভাবে চৌম্বক ক্ষেত্র শক্তিশালী হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ELECTROMAGNET_STRENGTH',
          configuration: { maxCurrentA: 5, maxTurns: 300 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'currentA',
                labelBn: 'বিদ্যুৎপ্রবাহ (I)',
                labelEn: 'Current (I)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0',
                maxValue: '5',
              },
              {
                name: 'turns',
                labelBn: 'প্যাঁচসংখ্যা (N)',
                labelEn: 'Number of turns (N)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '50',
                minValue: '1',
                maxValue: '300',
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
    topicTitleBn: 'ডিসি মোটর',
    topicTitleEn: 'DC Motor',
    lessonTitleBn: 'ডিসি মোটর',
    lessonTitleEn: 'DC Motor',
    prosePage: 337,
    proseBn:
      'চৌম্বক ক্ষেত্রে থাকা বিদ্যুৎপ্রবাহী কয়েল একটি টর্ক অনুভব করে যা কয়েলটিকে চৌম্বক ক্ষেত্রের সাথে সারিবদ্ধ করার দিকে ঘোরাতে চেষ্টা করে। সারিবদ্ধ অবস্থানে পৌঁছালে টর্ক শূন্য হয়ে যায় এবং কয়েলটি থেমে যেত, কিন্তু কম্যুটেটর নামের একটি যন্ত্রাংশ ঠিক তখনই বিদ্যুৎপ্রবাহের দিক উল্টে দেয়, ফলে টর্ক আবার তৈরি হয় এবং কয়েলটি ঘুরতেই থাকে।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_DC_MOTOR',
          configuration: { degreesPerSecond: 90 },
          status: ContentStatus.PUBLISHED,
          parameters: { create: [] },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  await ensureLesson({
    topicOrder: 4,
    topicTitleBn: 'ট্রান্সফর্মার',
    topicTitleEn: 'Transformer',
    lessonTitleBn: 'ট্রান্সফর্মার',
    lessonTitleEn: 'Transformer',
    prosePage: 341,
    proseBn:
      'ট্রান্সফর্মারের প্রাইমারি কয়েলে প্যাঁচসংখ্যা nₚ এবং সেকেন্ডারি কয়েলে প্যাঁচসংখ্যা nₛ হলে, প্রাইমারিতে Vₚ ভোল্টেজ প্রয়োগ করলে সেকেন্ডারিতে Vₛ = (nₛ/nₚ)Vₚ ভোল্টেজ পাওয়া যায়। বৈদ্যুতিক ক্ষমতার সংরক্ষণ থেকে বিদ্যুৎপ্রবাহের সম্পর্ক পাওয়া যায়: Iₛ = (nₚ/nₛ)Iₚ। ট্রান্সফর্মার শুধু এসি ভোল্টেজেই কাজ করে, কারণ এর জন্য প্রয়োজন ক্রমাগত পরিবর্তনশীল চৌম্বক ক্ষেত্র।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_TRANSFORMER',
          configuration: { maxTurns: 2000, maxVoltageV: 250, maxCurrentA: 5 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'primaryTurns',
                labelBn: 'প্রাইমারি প্যাঁচসংখ্যা (nₚ)',
                labelEn: 'Primary turns (np)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '100',
                minValue: '1',
                maxValue: '2000',
              },
              {
                name: 'secondaryTurns',
                labelBn: 'সেকেন্ডারি প্যাঁচসংখ্যা (nₛ)',
                labelEn: 'Secondary turns (ns)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1000',
                minValue: '1',
                maxValue: '2000',
              },
              {
                name: 'primaryVoltageV',
                labelBn: 'প্রাইমারি ভোল্টেজ (Vₚ)',
                labelEn: 'Primary voltage (Vp)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '12',
                minValue: '0',
                maxValue: '250',
              },
              {
                name: 'primaryCurrentA',
                labelBn: 'প্রাইমারি বিদ্যুৎপ্রবাহ (Iₚ)',
                labelEn: 'Primary current (Ip)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0',
                maxValue: '5',
              },
              {
                name: 'isAC',
                labelBn: 'এসি?',
                labelEn: 'AC?',
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

  console.log('Chapter 12 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
