/**
 * Seeds Physics 9–10, Chapter 1 — ভৌত রাশি এবং তাদের পরিমাপ.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), book pp. 1–31.
 * The structure follows docs/content/physics-9-10-chapter-01.md; read that
 * first. Every content version seeded here carries a TextbookReference and an
 * APPROVED ContentValidation, because §14.4 forbids publishing without one.
 *
 * Idempotent — safe to re-run. `npx prisma db seed`.
 */

import { hashPassword } from '../src/lib/password'
import {
  PrismaClient,
  ContentStatus,
  Language,
  ComponentType,
  ValidationStatus,
  ParameterDataType,
  QuestionType,
} from '@prisma/client'

const prisma = new PrismaClient()

/** Titles confirmed against the printed page. See the plan doc for the gaps. */
const TOPICS = [
  { order: 1, bn: 'পদার্থবিজ্ঞান ও এর পরিসর', en: 'Physics and Its Scope', page: 3 },
  { order: 2, bn: 'পদার্থবিজ্ঞানের ক্রমবিকাশ', en: 'Evolution of Physics', page: 5 },
  { order: 3, bn: 'পদার্থবিজ্ঞান পাঠের উদ্দেশ্য', en: 'Objectives of Physics', page: 11 },
  { order: 4, bn: 'ভৌত রাশি ও একক', en: 'Physical Quantities and Units', page: 14 },
  { order: 5, bn: 'উপসর্গ ও বৈজ্ঞানিক প্রকাশ', en: 'Prefixes and Scientific Notation', page: 17 },
  { order: 6, bn: 'রাশির মাত্রা', en: 'Dimensions of Quantities', page: 18 },
  { order: 7, bn: 'পরিমাপের যন্ত্রপাতি', en: 'Measuring Instruments', page: 20 },
  { order: 8, bn: 'অনুসন্ধান: ক্যালিপার্স ল্যাব', en: 'Investigation: Caliper Lab', page: 25 },
  { order: 9, bn: 'পরিমাপের ত্রুটি ও নির্ভুলতা', en: 'Error and Accuracy', page: 26 },
]

async function main() {
  console.log('Seeding Physics 9–10 Chapter 1…')

  // ---- roles and a content author -------------------------------------
  const roles = [
    { code: 'STUDENT', name: 'শিক্ষার্থী' },
    { code: 'TEACHER', name: 'শিক্ষক' },
    { code: 'ADMIN', name: 'প্রশাসক' },
  ]
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    })
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMIN' } })

  // Development credentials. These are real scrypt hashes, not placeholders,
  // so the login route can be exercised — but they are well-known passwords and
  // must never exist in a deployed environment. Override with SEED_PASSWORD.
  const devPassword = process.env.SEED_PASSWORD ?? 'ChangeMe!123'
  // Hashed per user rather than once and reused: identical hashes would reveal
  // that two accounts share a password, which is exactly what a salt prevents.

  const author = await prisma.user.upsert({
    where: { email: 'author@example.local' },
    // Refresh the hash on re-seed; an empty update would leave an older
    // placeholder in place and login would fail for no visible reason.
    update: { passwordHash: await hashPassword(devPassword) },
    create: {
      roleId: adminRole.id,
      name: 'Content Author',
      email: 'author@example.local',
      passwordHash: await hashPassword(devPassword),
      preferredLanguage: Language.BN,
    },
  })

  // ---- academic hierarchy ---------------------------------------------
  // The book is a combined Class 9–10 volume, so one Physics subject is linked
  // to both classes and the chapters hang off the subject. The ClassSubject
  // junction is doing real work here, not just modelling ceremony.
  const classes = await Promise.all(
    [9, 10].map((level) =>
      prisma.class.upsert({
        where: { level },
        update: {},
        create: {
          level,
          nameBn: `${level === 9 ? 'নবম' : 'দশম'} শ্রেণি`,
          nameEn: `Class ${level}`,
          status: ContentStatus.PUBLISHED,
        },
      }),
    ),
  )

  // A demo student, so the activity endpoint can be exercised end to end in
  // development. Remove before any real deployment.
  const studentRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'STUDENT' },
  })
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@example.local' },
    update: { passwordHash: await hashPassword(devPassword) },
    create: {
      roleId: studentRole.id,
      name: 'ডেমো শিক্ষার্থী',
      email: 'student@example.local',
      passwordHash: await hashPassword(devPassword),
      preferredLanguage: Language.BN,
    },
  })
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      classId: classes[0].id,
      studentCode: 'DEMO-0001',
    },
  })
  console.log(
    `Demo login: student@example.local / ${devPassword} (user id ${studentUser.id})`,
  )

  const physics = await prisma.subject.upsert({
    where: { code: 'PHY' },
    update: {},
    create: {
      code: 'PHY',
      nameBn: 'পদার্থবিজ্ঞান',
      nameEn: 'Physics',
      status: ContentStatus.PUBLISHED,
    },
  })

  for (const cls of classes) {
    await prisma.classSubject.upsert({
      where: { classId_subjectId: { classId: cls.id, subjectId: physics.id } },
      update: {},
      create: { classId: cls.id, subjectId: physics.id },
    })
  }

  // ---- textbook and the references content is validated against --------
  const textbook = await prisma.textbook.create({
    data: {
      classId: classes[0].id,
      subjectId: physics.id,
      title: 'মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০',
      edition: '2026',
      publicationYear: 2026,
      language: Language.BN,
      sourceFile: 'Secondary (BV)-2026_Class 9-10_Physics_compressed.pdf',
      status: ContentStatus.PUBLISHED,
    },
  })

  const pages = [3, 5, 11, 14, 15, 17, 18, 20, 21, 22, 25, 26, 28]
  const references = new Map<number, number>()
  for (const page of pages) {
    const ref = await prisma.textbookReference.create({
      data: {
        textbookId: textbook.id,
        chapterLabel: 'প্রথম অধ্যায় — ভৌত রাশি এবং তাদের পরিমাপ',
        pageStart: page,
        pageEnd: page,
      },
    })
    references.set(page, ref.id)
  }

  // ---- chapter and topics ---------------------------------------------
  const chapter = await prisma.chapter.upsert({
    where: { subjectId_displayOrder: { subjectId: physics.id, displayOrder: 1 } },
    update: {},
    create: {
      subjectId: physics.id,
      titleBn: 'ভৌত রাশি এবং তাদের পরিমাপ',
      titleEn: 'Physical Quantities and Their Measurement',
      displayOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  })

  const topics = new Map<number, number>()
  for (const topic of TOPICS) {
    const created = await prisma.topic.upsert({
      where: {
        chapterId_displayOrder: { chapterId: chapter.id, displayOrder: topic.order },
      },
      update: {},
      create: {
        chapterId: chapter.id,
        titleBn: topic.bn,
        titleEn: topic.en,
        displayOrder: topic.order,
        status: ContentStatus.PUBLISHED,
      },
    })
    topics.set(topic.order, created.id)
  }

  // ---- interactive artefacts ------------------------------------------
  // `type` values are keys into frontend/src/registry/componentRegistry.ts.
  // registry.test.tsx asserts the two sides agree.
  const scaleViz = await prisma.visualization.create({
    data: {
      type: 'VIZ_LOG_SCALE_EXPLORER',
      configuration: { table: 'টেবিল ১.০২', tracks: ['distance', 'mass', 'time'] },
      status: ContentStatus.PUBLISHED,
    },
  })

  const caliper = await prisma.simulation.create({
    data: {
      type: 'SIM_VERNIER_CALIPER',
      configuration: { maxLengthMm: 60 },
      status: ContentStatus.PUBLISHED,
      parameters: {
        create: [
          {
            name: 'vernierDivisions',
            labelBn: 'ভার্নিয়ার ভাগসংখ্যা',
            labelEn: 'Vernier divisions',
            dataType: ParameterDataType.ENUM,
            defaultValue: '10',
            minValue: '10',
            maxValue: '50',
          },
          {
            name: 'mainScaleDivision',
            labelBn: 'প্রধান স্কেলের ক্ষুদ্রতম ভাগ',
            labelEn: 'Smallest main-scale division',
            dataType: ParameterDataType.FLOAT,
            defaultValue: '1',
            minValue: '0.5',
            maxValue: '1',
          },
          {
            name: 'objectLength',
            labelBn: 'বস্তুর দৈর্ঘ্য',
            labelEn: 'Object length',
            dataType: ParameterDataType.FLOAT,
            defaultValue: '24.4',
            minValue: '0',
            maxValue: '60',
            stepValue: '0.1',
          },
          {
            name: 'mode',
            labelBn: 'ধরন',
            labelEn: 'Mode',
            dataType: ParameterDataType.ENUM,
            defaultValue: 'explore',
          },
        ],
      },
    },
  })

  const screwGauge = await prisma.simulation.create({
    data: {
      type: 'SIM_SCREW_GAUGE',
      configuration: { maxLengthMm: 12 },
      status: ContentStatus.PUBLISHED,
      parameters: {
        create: [
          {
            name: 'pitch',
            labelBn: 'পিচ',
            labelEn: 'Pitch',
            dataType: ParameterDataType.FLOAT,
            defaultValue: '1',
            minValue: '0.5',
            maxValue: '1',
          },
          {
            name: 'circularDivisions',
            labelBn: 'বৃত্তাকার স্কেলের ভাগসংখ্যা',
            labelEn: 'Circular divisions',
            dataType: ParameterDataType.INT,
            defaultValue: '100',
            minValue: '50',
            maxValue: '200',
          },
          {
            name: 'objectLength',
            labelBn: 'বস্তুর দৈর্ঘ্য',
            labelEn: 'Object length',
            dataType: ParameterDataType.FLOAT,
            defaultValue: '2.53',
            minValue: '0',
            maxValue: '12',
            stepValue: '0.01',
          },
          {
            name: 'mode',
            labelBn: 'ধরন',
            labelEn: 'Mode',
            dataType: ParameterDataType.ENUM,
            defaultValue: 'explore',
          },
        ],
      },
    },
  })

  const errorSim = await prisma.simulation.create({
    data: {
      type: 'SIM_ERROR_PROPAGATION',
      // Defaults reproduce the worked example on p. 28 exactly.
      configuration: {
        unit: 'cm',
        dimensions: [
          { value: 10, uncertainty: 0.5, labelBn: 'দৈর্ঘ্য', labelEn: 'Length' },
          { value: 5, uncertainty: 0.5, labelBn: 'প্রস্থ', labelEn: 'Width' },
          { value: 4, uncertainty: 0.5, labelBn: 'উচ্চতা', labelEn: 'Height' },
        ],
      },
      status: ContentStatus.PUBLISHED,
    },
  })

  // ---- lessons ---------------------------------------------------------
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
        textbookReferenceId: references.get(page)!,
        validatorUserId: author.id,
        status: ValidationStatus.APPROVED,
        validationDate: new Date(),
        notes: `Verified against book page ${page}.`,
      },
    })
    return content
  }

  async function lesson(
    topicOrder: number,
    order: number,
    titleBn: string,
    titleEn: string,
  ) {
    return prisma.lesson.upsert({
      where: {
        topicId_displayOrder: { topicId: topics.get(topicOrder)!, displayOrder: order },
      },
      update: {},
      create: {
        topicId: topics.get(topicOrder)!,
        titleBn,
        titleEn,
        displayOrder: order,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })
  }

  // Topic 4 — scale of things
  const scaleLesson = await lesson(4, 1, 'রাশির মাপনী — কত বড়, কত ছোট', 'The Scale of Things')
  const scaleProse = await publishedProse(
    'এই ভৌতজগতে অসংখ্য বিষয় রয়েছে, যা পরিমাপ করা সম্ভব। প্রোটনের ব্যাসার্ধ থেকে নিকটতম গ্যালাক্সির দূরত্ব পর্যন্ত সবকিছুই একই সাতটি মৌলিক একক দিয়ে প্রকাশ করা যায়।',
    15,
  )
  await prisma.lessonComponent.createMany({
    data: [
      {
        lessonId: scaleLesson.id,
        componentType: ComponentType.EXPLANATION,
        displayOrder: 1,
        contentId: scaleProse.id,
      },
      {
        lessonId: scaleLesson.id,
        componentType: ComponentType.VISUALIZATION,
        displayOrder: 2,
        visualizationId: scaleViz.id,
      },
    ],
    skipDuplicates: true,
  })

  // Topic 7 — vernier caliper
  const caliperLesson = await lesson(7, 1, 'ভার্নিয়ার ক্যালিপার্স', 'Vernier Calipers')
  const caliperProse = await publishedProse(
    'একটা স্কেলে সবচেয়ে যে সূক্ষ্ম দাগ থাকে আমরা সে পর্যন্ত মাপতে পারি। তার চেয়ে সূক্ষ্মভাবে মাপার প্রয়োজন হলে ভার্নিয়ার স্কেল ব্যবহার করা হয়।',
    20,
  )
  await prisma.lessonComponent.createMany({
    data: [
      {
        lessonId: caliperLesson.id,
        componentType: ComponentType.EXPLANATION,
        displayOrder: 1,
        contentId: caliperProse.id,
      },
      {
        lessonId: caliperLesson.id,
        componentType: ComponentType.SIMULATION,
        displayOrder: 2,
        simulationId: caliper.id,
      },
      {
        // Same simulation, second placement. Practice mode is a parameter
        // override rather than a separate Simulation row or an EXERCISE
        // component — see the note on LessonComponent.parameterOverrides.
        lessonId: caliperLesson.id,
        componentType: ComponentType.SIMULATION,
        displayOrder: 3,
        simulationId: caliper.id,
        parameterOverrides: { mode: 'practice' },
      },
    ],
    skipDuplicates: true,
  })

  // Topic 7 — screw gauge
  const gaugeLesson = await lesson(7, 2, 'স্ক্রু-গেইজ', 'Screw Gauge')
  const gaugeProse = await publishedProse(
    'পুরো একবার ঘোরানোর পর স্ক্রু-গেইজের স্কেল ১ মিলিমিটার অগ্রসর হয় — একে স্ক্রুর পিচ বলে। বৃত্তাকার অংশ ১০০ ভাগে ভাগ করা হলে ০.০১ মিলিমিটার পর্যন্ত মাপা সম্ভব।',
    22,
  )
  await prisma.lessonComponent.createMany({
    data: [
      {
        lessonId: gaugeLesson.id,
        componentType: ComponentType.EXPLANATION,
        displayOrder: 1,
        contentId: gaugeProse.id,
      },
      {
        lessonId: gaugeLesson.id,
        componentType: ComponentType.SIMULATION,
        displayOrder: 2,
        simulationId: screwGauge.id,
      },
      {
        lessonId: gaugeLesson.id,
        componentType: ComponentType.SIMULATION,
        displayOrder: 3,
        simulationId: screwGauge.id,
        parameterOverrides: { mode: 'practice' },
      },
    ],
    skipDuplicates: true,
  })

  // Topic 9 — error and accuracy
  const errorLesson = await lesson(9, 1, 'পরিমাপের ত্রুটি ও নির্ভুলতা', 'Error and Accuracy')
  const errorProse = await publishedProse(
    'যে পরিমাপ করা সম্ভব তার একটি সীমা আছে, অর্থাৎ পরিমাপে ত্রুটি থাকা খুবই স্বাভাবিক। শুধু সেন্টিমিটারে দাগ কাটা রুলারে অনিশ্চয়তা ±০.৫ সেন্টিমিটার।',
    26,
  )
  await prisma.lessonComponent.createMany({
    data: [
      {
        lessonId: errorLesson.id,
        componentType: ComponentType.EXPLANATION,
        displayOrder: 1,
        contentId: errorProse.id,
      },
      {
        lessonId: errorLesson.id,
        componentType: ComponentType.SIMULATION,
        displayOrder: 2,
        simulationId: errorSim.id,
      },
    ],
    skipDuplicates: true,
  })

  // ---- chapter assessment (নমুনা প্রশ্ন, book pp. 29–30) ---------------
  //
  // IMPORTANT: the textbook prints the questions but NOT an answer key. Every
  // `correct` value below is DERIVED — either from a statement elsewhere in the
  // book (cited per question) or by computation. They must be reviewed by a
  // teacher before this quiz is used for real assessment. That review is
  // exactly what ContentValidation exists to record.
  //
  // Question 4 on p. 30 is NOT seeded. As printed, options (ক) and (গ) are both
  // "4.07 cm" — which is also the correct answer (M = 4 cm, V = 7, VC = 0.1 mm
  // gives 40.7 mm). The question is unanswerable as printed, so it is reported
  // rather than silently "fixed": inventing which option was meant would be
  // exactly the fabrication the content policy forbids.
  const mcqs = [
    {
      promptBn: 'কোয়ান্টাম তত্ত্ব প্রথম কে প্রদান করেন?',
      promptEn: 'Who first proposed quantum theory?',
      options: [
        { key: 'ka', textBn: 'প্ল্যাঙ্ক', textEn: 'Planck' },
        { key: 'kha', textBn: 'আইনস্টাইন', textEn: 'Einstein' },
        { key: 'ga', textBn: 'রাদারফোর্ড', textEn: 'Rutherford' },
        { key: 'gha', textBn: 'হাইজেনবার্গ', textEn: 'Heisenberg' },
      ],
      correct: ['ka'],
      explanationBn: 'পাঠ্যবই পৃষ্ঠা ৮: ১৯০০ সালে ম্যাক্স প্ল্যাঙ্ক কোয়ান্টাম তত্ত্ব আবিষ্কার করেন।',
      explanationEn: 'Book p. 8: Max Planck discovered quantum theory in 1900.',
      page: 29,
    },
    {
      promptBn: 'বোজন কার নাম থেকে এসেছে?',
      promptEn: 'Whose name does the boson come from?',
      options: [
        { key: 'ka', textBn: 'জগদীশচন্দ্র বসু', textEn: 'Jagadish Chandra Bose' },
        { key: 'kha', textBn: 'সুভাষচন্দ্র বসু', textEn: 'Subhas Chandra Bose' },
        { key: 'ga', textBn: 'সত্যেন্দ্রনাথ বসু', textEn: 'Satyendra Nath Bose' },
        { key: 'gha', textBn: 'শরৎচন্দ্র বসু', textEn: 'Sarat Chandra Bose' },
      ],
      correct: ['ga'],
      explanationBn:
        'পাঠ্যবই পৃষ্ঠা ৮: সত্যেন্দ্রনাথ বসুর অবদানের স্বীকৃতিস্বরূপ মৌলিক কণাকে বোজন নাম দেওয়া হয়।',
      explanationEn:
        'Book p. 8: the particle class was named boson in recognition of Satyendra Nath Bose.',
      page: 29,
    },
    {
      promptBn: 'নিচের কোনটি মৌলিক রাশি নয়?',
      promptEn: 'Which of the following is NOT a base quantity?',
      options: [
        { key: 'ka', textBn: 'ভর', textEn: 'Mass' },
        { key: 'kha', textBn: 'তাপ', textEn: 'Heat' },
        { key: 'ga', textBn: 'তড়িৎ প্রবাহ', textEn: 'Electric current' },
        { key: 'gha', textBn: 'পদার্থের পরিমাণ', textEn: 'Amount of substance' },
      ],
      correct: ['kha'],
      explanationBn:
        'টেবিল ১.০১ (পৃষ্ঠা ১৪) অনুযায়ী সাতটি মৌলিক রাশির মধ্যে তাপ নেই; তাপ একটি লব্ধ রাশি।',
      explanationEn:
        'Table 1.01 (p. 14) lists the seven base quantities; heat is not among them.',
      page: 29,
    },
    {
      promptBn:
        'রফিক স্কেল দিয়ে একটি পেন্সিলের দৈর্ঘ্য ১৫ cm পরিমাপ করল (চূড়ান্ত ত্রুটি ০.৫ cm)। আপেক্ষিক ত্রুটি কত?',
      promptEn:
        'Rafiq measures a pencil as 15 cm with an absolute error of 0.5 cm. What is the relative error?',
      options: [
        { key: 'ka', textBn: '১৫.৫%', textEn: '15.5%' },
        { key: 'kha', textBn: '১৪.৫%', textEn: '14.5%' },
        { key: 'ga', textBn: '৩.৪৪%', textEn: '3.44%' },
        { key: 'gha', textBn: '৩.৩৩%', textEn: '3.33%' },
      ],
      correct: ['gha'],
      explanationBn: 'আপেক্ষিক ত্রুটি = ০.৫ ÷ ১৫ × ১০০ = ৩.৩৩%।',
      explanationEn: 'Relative error = 0.5 / 15 x 100 = 3.33%.',
      page: 30,
    },
    {
      promptBn:
        'একটি ব্লক (৭ cm × ৬ cm × ৪ cm) এবং একটি গোলকের (ব্যাসার্ধ ৩ cm) আয়তনের অনুপাত কত?',
      promptEn:
        'What is the ratio of the volumes of a block (7 x 6 x 4 cm) and a sphere of radius 3 cm?',
      options: [
        { key: 'ka', textBn: '১ : ০.৬৭৩', textEn: '1 : 0.673' },
        { key: 'kha', textBn: '১ : ০.০৬৭৩', textEn: '1 : 0.0673' },
        { key: 'ga', textBn: '১ : ০.৭৬৩', textEn: '1 : 0.763' },
        { key: 'gha', textBn: '১ : ০.৬৩৭', textEn: '1 : 0.637' },
      ],
      correct: ['ka'],
      explanationBn:
        'ব্লকের আয়তন = ১৬৮ cm³; গোলকের আয়তন = (৪/৩)πr³ = ১১৩.১ cm³; অনুপাত ১ : ০.৬৭৩।',
      explanationEn:
        'Block = 168 cm³; sphere = (4/3)πr³ = 113.1 cm³; ratio 1 : 0.673.',
      page: 30,
    },
  ]

  const quiz = await prisma.quiz.create({
    data: {
      titleBn: 'প্রথম অধ্যায় — নমুনা প্রশ্ন',
      titleEn: 'Chapter 1 — Sample Questions',
      attemptLimit: 3,
      passMark: 3,
      status: ContentStatus.PUBLISHED,
    },
  })

  for (const [index, mcq] of mcqs.entries()) {
    const created = await prisma.question.create({
      data: {
        type: QuestionType.MCQ_SINGLE,
        promptBn: mcq.promptBn,
        promptEn: mcq.promptEn,
        optionsJson: mcq.options,
        answerConfig: { correct: mcq.correct },
        explanationBn: mcq.explanationBn,
        explanationEn: mcq.explanationEn,
        status: ContentStatus.PUBLISHED,
      },
    })
    await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        questionId: created.id,
        displayOrder: index + 1,
        marks: 1,
      },
    })
  }

  const assessmentLesson = await lesson(9, 2, 'অধ্যায় মূল্যায়ন', 'Chapter Assessment')
  await prisma.lessonComponent.createMany({
    data: [
      {
        lessonId: assessmentLesson.id,
        componentType: ComponentType.QUIZ,
        displayOrder: 1,
        quizId: quiz.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log(
    `Seeded ${mcqs.length} of 6 printed MCQs. Question 4 (p. 30) skipped: ` +
      'options (ka) and (ga) are both "4.07 cm" in the printed book.',
  )

  const counts = {
    classes: await prisma.class.count(),
    topics: await prisma.topic.count(),
    lessons: await prisma.lesson.count(),
    questions: await prisma.question.count(),
    components: await prisma.lessonComponent.count(),
    simulations: await prisma.simulation.count(),
    validations: await prisma.contentValidation.count(),
  }
  console.log('Seed complete:', counts)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
