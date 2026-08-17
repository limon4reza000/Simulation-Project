/**
 * Adds Chapter 13 — তেজস্ক্রিয়তা ও ইলেকট্রনিকস (Radioactivity and Electronics)
 * — to an already-seeded database.
 *
 * This is the FINAL chapter of the textbook. NON-DESTRUCTIVE and additive
 * only, same pattern as seedChapter2.ts through seedChapter12.ts:
 * idempotency is checked per lesson at (topicId, displayOrder), so this can
 * be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 347–360 — see
 * docs/content/physics-9-10-chapter-13.md.
 *
 * Run: npx tsx scripts/seedChapter13.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 13 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'তেজস্ক্রিয়তা ও ইলেকট্রনিকস',
      titleEn: 'Radioactivity and Electronics',
      displayOrder: 13,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'ত্রয়োদশ অধ্যায় — তেজস্ক্রিয়তা ও ইলেকট্রনিকস', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'ত্রয়োদশ অধ্যায় — তেজস্ক্রিয়তা ও ইলেকট্রনিকস',
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

  console.log('Seeding Chapter 13 — তেজস্ক্রিয়তা ও ইলেকট্রনিকস (Radioactivity and Electronics)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'অর্ধায়ু',
    topicTitleEn: 'Half-Life',
    lessonTitleBn: 'অর্ধায়ু',
    lessonTitleEn: 'Half-Life',
    prosePage: 352,
    proseBn:
      'একটি নির্দিষ্ট তেজস্ক্রিয় নিউক্লিয়াস ঠিক কোন মুহূর্তে বিকিরণ করবে তা বলা সম্ভব নয়, তবে যে সময়ে একটি নমুনার অর্ধেক সংখ্যক নিউক্লিয়াসের তেজস্ক্রিয় বিকিরণ ঘটে সেটিকে অর্ধায়ু বলা হয়। অর্ধায়ু যত কম, তেজস্ক্রিয়তা তত বেশি। দুটি অর্ধায়ু পার হলে মাত্র ১/৪ অংশ মূল তেজস্ক্রিয় নিউক্লিয়াস অবশিষ্ট থাকে — N = N₀(১/২)^(t/T)।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_HALF_LIFE',
          configuration: { maxHalfLifeYears: 500, maxTimeYears: 1000 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'halfLifeYears',
                labelBn: 'অর্ধায়ু (T)',
                labelEn: 'Half-life (T)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '100',
                minValue: '1',
                maxValue: '500',
              },
              {
                name: 'elapsedYears',
                labelBn: 'অতিবাহিত সময় (t)',
                labelEn: 'Elapsed time (t)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '200',
                minValue: '0',
                maxValue: '1000',
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
    topicTitleBn: 'তেজস্ক্রিয় বিকিরণ ও প্রতিরক্ষা',
    topicTitleEn: 'Radiation and Shielding',
    lessonTitleBn: 'তেজস্ক্রিয় বিকিরণ ও প্রতিরক্ষা',
    lessonTitleEn: 'Radiation and Shielding',
    prosePage: 350,
    proseBn:
      'নিউক্লিয়াস থেকে নির্গত তিনটি প্রধান তেজস্ক্রিয় রশ্মি হলো আলফা, বিটা এবং গামা। আলফা রশ্মি (হিলিয়াম নিউক্লিয়াস) খুব বেশি আয়নিত করে বলে একটি কাগজের পৃষ্ঠাতেই থেমে যায়। বিটা রশ্মি (ইলেকট্রন) কাগজ ভেদ করে যেতে পারে, থামাতে কয়েক মিলিমিটার অ্যালুমিনিয়াম দরকার। গামা রশ্মির কোনো চার্জ বা ভর নেই বলে একে থামাতে কয়েক সেন্টিমিটার পুরু সিসার প্রয়োজন হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_RADIATION_SHIELDING',
          configuration: { maxThicknessMm: 40 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'radiation',
                labelBn: 'বিকিরণের ধরন',
                labelEn: 'Radiation type',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'beta',
              },
              {
                name: 'material',
                labelBn: 'প্রতিরক্ষা উপাদান',
                labelEn: 'Shield material',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'paper',
              },
              {
                name: 'thicknessMm',
                labelBn: 'পুরুত্ব',
                labelEn: 'Thickness',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '0',
                maxValue: '40',
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
    topicTitleBn: 'n-টাইপ ও p-টাইপ সেমিকন্ডাক্টর',
    topicTitleEn: 'n-Type and p-Type Semiconductors',
    lessonTitleBn: 'n-টাইপ ও p-টাইপ সেমিকন্ডাক্টর',
    lessonTitleEn: 'n-Type and p-Type Semiconductors',
    prosePage: 358,
    proseBn:
      'সিলিকনের শেষ কক্ষপথে চারটি ইলেকট্রন থাকে, প্রতিটি প্রতিবেশী পরমাণুর সাথে ভাগাভাগি করা। সিলিকন কেলাসে পাঁচ যোজন ইলেকট্রনযুক্ত ফসফরাসের মতো পরমাণু মেশালে একটি বাড়তি মুক্ত ইলেকট্রন পাওয়া যায় — n-টাইপ সেমিকন্ডাক্টর। তিন যোজন ইলেকট্রনযুক্ত বোরনের মতো পরমাণু মেশালে একটি ফাঁকা জায়গা বা হোল তৈরি হয়, যা ধনাত্মক চার্জবাহকের মতো আচরণ করে — p-টাইপ সেমিকন্ডাক্টর।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_SEMICONDUCTOR_DOPING',
          configuration: { minValence: 3, maxValence: 5 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'dopantValenceElectrons',
                labelBn: 'ডোপান্টের যোজন ইলেকট্রন সংখ্যা',
                labelEn: "Dopant's valence electrons",
                dataType: ParameterDataType.FLOAT,
                defaultValue: '5',
                minValue: '3',
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
    topicOrder: 4,
    topicTitleBn: 'দশমিক ও বাইনারি সংখ্যা',
    topicTitleEn: 'Decimal and Binary Numbers',
    lessonTitleBn: 'দশমিক ও বাইনারি সংখ্যা',
    lessonTitleEn: 'Decimal and Binary Numbers',
    prosePage: 357,
    proseBn:
      'আমাদের চারপাশের তথ্য (শব্দ, আলো, চাপ, তাপমাত্রা) নিরবচ্ছিন্নভাবে পরিবর্তিত হয় — একে অ্যানালগ সংকেত বলে। ডিজিটাল ইলেকট্রনিকসে এই তথ্যকে বিচ্ছিন্ন মানে রূপান্তর করে সংরক্ষণ করা হয়, এবং সংখ্যাগুলো বাইনারি (০ এবং ১) আকারে প্রকাশ করা হয় — কারণ একটি ভোল্টেজকে ১ এবং শূন্য ভোল্টেজকে ০ ধরে সহজেই প্রক্রিয়া করা যায়। ডিজিটাল সংকেত অ্যানালগের তুলনায় নয়েজ প্রতিরোধী বলে এর গুণগত মান অবিকৃত থাকে।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_BINARY_CONVERTER',
          configuration: { maxDecimal: 255 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'decimalValue',
                labelBn: 'দশমিক মান',
                labelEn: 'Decimal value',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '42',
                minValue: '0',
                maxValue: '255',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 13 seeding complete.')
  console.log('This was the final chapter — all 13 chapters of the textbook now have Tier-1 simulation coverage.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
