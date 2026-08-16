/**
 * Adds Chapter 9 — আলোর প্রতিসরণ (Refraction of Light) — to an
 * already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter8.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 243–269 — see
 * docs/content/physics-9-10-chapter-09.md.
 *
 * Run: npx tsx scripts/seedChapter9.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 9 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'আলোর প্রতিসরণ',
      titleEn: 'Refraction of Light',
      displayOrder: 9,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'নবম অধ্যায় — আলোর প্রতিসরণ', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'নবম অধ্যায় — আলোর প্রতিসরণ',
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

  console.log('Seeding Chapter 9 — আলোর প্রতিসরণ (Refraction of Light)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'প্রতিসরণের সূত্র',
    topicTitleEn: "Snell's Law",
    lessonTitleBn: 'প্রতিসরণের সূত্র',
    lessonTitleEn: "Snell's Law",
    prosePage: 244,
    proseBn:
      'আলো এক মাধ্যম থেকে অন্য মাধ্যমে প্রবেশ করলে দিক পরিবর্তন করে, একে প্রতিসরণ বলে। প্রথম মাধ্যমের প্রতিসরণাঙ্ক n১, দ্বিতীয় মাধ্যমের প্রতিসরণাঙ্ক n২, আপতন কোণ θ১ এবং প্রতিসরণ কোণ θ২ হলে n১ sinθ১ = n২ sinθ২। হালকা মাধ্যম থেকে ঘন মাধ্যমে গেলে রশ্মি লম্বের দিকে বেঁকে যায়, ঘন থেকে হালকায় গেলে লম্ব থেকে দূরে সরে যায়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_SNELLS_LAW',
          configuration: { maxAngleDeg: 80 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'medium1Key',
                labelBn: 'প্রথম মাধ্যম',
                labelEn: 'First medium',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'air',
              },
              {
                name: 'medium2Key',
                labelBn: 'দ্বিতীয় মাধ্যম',
                labelEn: 'Second medium',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'glass',
              },
              {
                name: 'angleOfIncidenceDeg',
                labelBn: 'আপতন কোণ (θ১)',
                labelEn: 'Angle of incidence (θ1)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '45',
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
    topicTitleBn: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন',
    topicTitleEn: 'Total Internal Reflection',
    lessonTitleBn: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন',
    lessonTitleEn: 'Total Internal Reflection',
    prosePage: 249,
    proseBn:
      'ঘন মাধ্যম থেকে হালকা মাধ্যমের দিকে আলো পাঠালে একটি নির্দিষ্ট কোণের পর প্রতিসরণ আর সম্ভব থাকে না, তার বদলে পুরো আলোটাই প্রতিফলিত হয়ে যায় — একে পূর্ণ অভ্যন্তরীণ প্রতিফলন বলে। যে কোণে প্রতিসরণ কোণ ঠিক ৯০° হয় সেই আপতন কোণকে ক্রান্তি কোণ বলে, sinθc = n১/n২। অপটিক্যাল ফাইবার এই নীতির ওপর ভিত্তি করেই কাজ করে।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_CRITICAL_ANGLE',
          configuration: { nDense: 1.52, nLight: 1 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'incidenceDeg',
                labelBn: 'আপতন কোণ',
                labelEn: 'Angle of incidence',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '30',
                minValue: '0',
                maxValue: '89',
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
    topicTitleBn: 'লেন্সে প্রতিবিম্ব',
    topicTitleEn: 'Image in a Lens',
    lessonTitleBn: 'লেন্সে প্রতিবিম্ব',
    lessonTitleEn: 'Image in a Lens',
    prosePage: 259,
    proseBn:
      'অবতল লেন্সে সব সময়ই অবাস্তব, সোজা এবং খর্বিত প্রতিবিম্ব তৈরি হয়, বস্তুর অবস্থান যাই হোক না কেন। উত্তল লেন্সে প্রতিবিম্বের প্রকৃতি বস্তুর অবস্থানের ওপর নির্ভর করে: ফোকাস দূরত্বের ভেতরে রাখলে অবাস্তব, সোজা ও বিবর্ধিত প্রতিবিম্ব হয়; দ্বিগুণ ফোকাস দূরত্বের বাইরে রাখলে বাস্তব, উল্টো ও খর্বিত প্রতিবিম্ব হয়; আর ঠিক ফোকাস বিন্দুতে রাখলে কোনো প্রতিবিম্বই তৈরি হয় না।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_LENS_IMAGE',
          configuration: { focalLengthMagnitudeM: 2, maxObjectDistanceM: 12 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'lensType',
                labelBn: 'লেন্সের ধরন',
                labelEn: 'Lens type',
                dataType: ParameterDataType.ENUM,
                defaultValue: 'convex',
              },
              {
                name: 'objectDistanceM',
                labelBn: 'বস্তুর দূরত্ব (u)',
                labelEn: 'Object distance (u)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '5',
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
    topicTitleBn: 'লেন্সের ক্ষমতা',
    topicTitleEn: 'Power of a Lens',
    lessonTitleBn: 'লেন্সের ক্ষমতা',
    lessonTitleEn: 'Power of a Lens',
    prosePage: 265,
    proseBn:
      'লেন্সের ক্ষমতা P হচ্ছে ফোকাস দূরত্বের ব্যস্তানুপাতিক: P = ১/f, যেখানে f মিটারে দেওয়া হলে P-এর একক ডায়াপ্টার। ফোকাস দূরত্ব যত কম, লেন্সের ক্ষমতা তত বেশি। উত্তল লেন্সের ক্ষমতা ধনাত্মক, অবতল লেন্সের ক্ষমতা ঋণাত্মক ধরা হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_LENS_POWER',
          configuration: { maxFocalLengthM: 2 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'focalLengthM',
                labelBn: 'ফোকাস দূরত্ব (f)',
                labelEn: 'Focal length (f)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '0.4',
                minValue: '-2',
                maxValue: '2',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 9 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
