/**
 * Adds Chapter 10 — স্থির বিদ্যুৎ (Static Electricity) — to an
 * already-seeded database.
 *
 * NON-DESTRUCTIVE and additive only, same pattern as seedChapter2.ts through
 * seedChapter9.ts: idempotency is checked per lesson at (topicId,
 * displayOrder), so this can be re-run safely as more lessons are added.
 *
 * Content traced to book pp. 271–297 — see
 * docs/content/physics-9-10-chapter-10.md.
 *
 * Run: npx tsx scripts/seedChapter10.ts
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
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 10 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'স্থির বিদ্যুৎ',
      titleEn: 'Static Electricity',
      displayOrder: 10,
      status: ContentStatus.PUBLISHED,
    },
  })

  async function referenceFor(page: number): Promise<number> {
    const existing = await prisma.textbookReference.findFirst({
      where: { textbookId: textbook.id, chapterLabel: 'দশম অধ্যায় — স্থির বিদ্যুৎ', pageStart: page },
    })
    if (existing) return existing.id
    const created = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'দশম অধ্যায় — স্থির বিদ্যুৎ',
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

  console.log('Seeding Chapter 10 — স্থির বিদ্যুৎ (Static Electricity)…')

  await ensureLesson({
    topicOrder: 1,
    topicTitleBn: 'ঘর্ষণে চার্জ স্থানান্তর',
    topicTitleEn: 'Charge Transfer by Friction',
    lessonTitleBn: 'ঘর্ষণে চার্জ স্থানান্তর',
    lessonTitleEn: 'Charge Transfer by Friction',
    prosePage: 273,
    proseBn:
      'পরমাণুর কেন্দ্রে থাকে নিউক্লিয়াস, তাকে ঘিরে ঘোরে ইলেকট্রন। প্রোটনের চার্জ ধনাত্মক এবং ইলেকট্রনের চার্জ ঋণাত্মক, উভয়ের মান সমান — ১.৬×১০⁻¹⁹ কুলম্ব। ঘর্ষণের মাধ্যমে একটি বস্তু থেকে ইলেকট্রন সরে অন্য বস্তুতে গেলে প্রথম বস্তুটি ধনাত্মক এবং দ্বিতীয়টি ঋণাত্মক চার্জযুক্ত হয় — ঠিক যতগুলো ইলেকট্রন স্থানান্তরিত হয়েছে সেই পরিমাণেই।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ELECTRON_TRANSFER',
          configuration: { maxElectronsBillions: 100 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'electronBillions',
                labelBn: 'স্থানান্তরিত ইলেকট্রন (বিলিয়ন)',
                labelEn: 'Electrons transferred (billions)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0',
                maxValue: '100',
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
    topicTitleBn: 'তড়িৎ বল',
    topicTitleEn: 'Electric Force',
    lessonTitleBn: 'তড়িৎ বল',
    lessonTitleEn: 'Electric Force',
    prosePage: 280,
    proseBn:
      'দুটি বিন্দু চার্জ q১ ও q২ এর মধ্যবর্তী দূরত্ব r হলে তাদের মধ্যেকার বল F = kq১q২/r², যেখানে k = ৯×১০⁹ Nm²/C² — এটি কুলম্বের সূত্র। সমধর্মী চার্জ একে অপরকে বিকর্ষণ করে, বিপরীতধর্মী চার্জ আকর্ষণ করে। এই সূত্রটি নিউটনের মহাকর্ষ সূত্রের সাথে গাণিতিকভাবে হুবহু একই রকম, শুধু ভরের বদলে চার্জ এবং G এর বদলে k বসিয়ে দিলেই হয়।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_COULOMBS_LAW',
          configuration: { maxSeparationM: 2, maxChargeC: 5 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'q1',
                labelBn: 'আধান q১ (C)',
                labelEn: 'Charge q1 (C)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '1',
                minValue: '-5',
                maxValue: '5',
              },
              {
                name: 'q2',
                labelBn: 'আধান q২ (C)',
                labelEn: 'Charge q2 (C)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '-1',
                minValue: '-5',
                maxValue: '5',
              },
              {
                name: 'separationM',
                labelBn: 'দূরত্ব (r)',
                labelEn: 'Separation (r)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '0.5',
                minValue: '0.05',
                maxValue: '2',
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
    topicTitleBn: 'তড়িৎ ক্ষেত্র ও বিভব',
    topicTitleEn: 'Electric Field and Potential',
    lessonTitleBn: 'তড়িৎ ক্ষেত্র ও বিভব',
    lessonTitleEn: 'Electric Field and Potential',
    prosePage: 284,
    proseBn:
      'একটি চার্জ q তার চারপাশে তড়িৎ ক্ষেত্র তৈরি করে, যার মান E = kq/r²। এই ক্ষেত্রে অন্য একটি চার্জ q0 আনলে সেটি F = Eq0 বল অনুভব করে। তড়িৎ বিভব V(r) = kq/r — এটি একটি স্কেলার রাশি এবং দূরত্বের সরাসরি ব্যস্তানুপাতিক, যেখানে ক্ষেত্র দূরত্বের বর্গের ব্যস্তানুপাতিক।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_ELECTRIC_FIELD',
          configuration: { maxDistanceM: 20, maxChargeC: 10 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'q',
                labelBn: 'উৎস আধান (q)',
                labelEn: 'Source charge (q)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '5',
                minValue: '-10',
                maxValue: '10',
              },
              {
                name: 'distanceM',
                labelBn: 'দূরত্ব (r)',
                labelEn: 'Distance (r)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0.5',
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
    topicOrder: 4,
    topicTitleBn: 'ধারকে সঞ্চিত শক্তি',
    topicTitleEn: 'Energy Stored in a Capacitor',
    lessonTitleBn: 'ধারকে সঞ্চিত শক্তি',
    lessonTitleEn: 'Energy Stored in a Capacitor',
    prosePage: 290,
    proseBn:
      'পরিবাহী দিয়ে তৈরি কোনো ব্যবস্থায় চার্জ দিলে তার বিভব কতটুকু বাড়বে সেটি নির্ভর করে ব্যবস্থাটির ধারকত্বের ওপর — V = Q/C। ধারকে চার্জ জমা রাখলে তার ভেতরে তড়িৎ ক্ষেত্রে শক্তি সঞ্চিত থাকে, যার পরিমাণ = ½CV²। ধারকত্বের একক ফ্যারাড (F)।',
    makeArtefact: async () => {
      const sim = await prisma.simulation.create({
        data: {
          type: 'SIM_CAPACITOR_ENERGY',
          configuration: { maxCapacitanceUF: 100, maxVoltageV: 50 },
          status: ContentStatus.PUBLISHED,
          parameters: {
            create: [
              {
                name: 'capacitanceUF',
                labelBn: 'ধারকত্ব (C)',
                labelEn: 'Capacitance (C)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '20',
                minValue: '1',
                maxValue: '100',
              },
              {
                name: 'voltageV',
                labelBn: 'ভোল্টেজ (V)',
                labelEn: 'Voltage (V)',
                dataType: ParameterDataType.FLOAT,
                defaultValue: '10',
                minValue: '0',
                maxValue: '50',
              },
            ],
          },
        },
      })
      return { id: sim.id, isSimulation: true }
    },
  })

  console.log('Chapter 10 seeding complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
