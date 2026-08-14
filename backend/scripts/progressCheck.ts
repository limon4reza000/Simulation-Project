/**
 * Live verification of progress aggregation against a real database.
 *
 * NON-DESTRUCTIVE. Creates one isolated test student, exercises progress as
 * that student only, and removes exactly the rows it created (the user cascade
 * takes its sessions, progress and attempts with it). It never touches seeded
 * content or any pre-existing student.
 *
 * Run: npx tsx scripts/progressCheck.ts
 */

import { PrismaClient, ProgressStatus } from '@prisma/client'
import { hashPassword } from '../src/lib/password'
import {
  recordLessonProgress,
  recomputeAfterQuiz,
  getChapterProgress,
} from '../src/services/progress'

const prisma = new PrismaClient()

const TEST_EMAIL = 'progress-check@test.invalid'
let pass = 0
let fail = 0

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    console.log(`  FAIL  ${name} ${detail}`)
  }
}

async function main() {
  // ---- set up an isolated student -----------------------------------------
  const studentRole = await prisma.role.findUniqueOrThrow({ where: { code: 'STUDENT' } })
  const anyClass = await prisma.class.findFirstOrThrow()

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      roleId: studentRole.id,
      name: 'Progress Check',
      email: TEST_EMAIL,
      passwordHash: await hashPassword('irrelevant-not-used'),
    },
  })
  await prisma.student.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, classId: anyClass.id, studentCode: 'TEST-PROG-1' },
  })
  console.log(`\nIsolated test student created: id ${user.id} (${TEST_EMAIL})`)

  const chapter = await prisma.chapter.findFirstOrThrow({ where: { status: 'PUBLISHED' } })
  const lessons = await prisma.lesson.findMany({
    where: { status: 'PUBLISHED', deletedAt: null, topic: { chapterId: chapter.id } },
    orderBy: { id: 'asc' },
    select: { id: true, topicId: true, titleEn: true },
  })
  console.log(`Chapter ${chapter.id} has ${lessons.length} published lessons\n`)

  // ---- 1. baseline ---------------------------------------------------------
  console.log('=== 1. Baseline: a new student has zero progress ===')
  const before = await getChapterProgress(prisma, user.id, chapter.id)
  check('overall is 0%', before.overallPercent === 0, `got ${before.overallPercent}`)
  check('no weak topics flagged for an untouched chapter',
    before.weakTopicIds.length === 0, JSON.stringify(before.weakTopicIds))
  check('every topic reports 0%', before.topics.every((t) => t.completionPercent === 0))
  check('scoreAvg is null, not 0, before any attempt',
    before.topics.every((t) => t.scoreAvg === null))

  // ---- 2. completing one lesson -------------------------------------------
  console.log('\n=== 2. Completing one lesson rolls up ===')
  const first = lessons[0]
  await recordLessonProgress(prisma, user.id, first.id, ProgressStatus.COMPLETED, 120)

  const afterOne = await getChapterProgress(prisma, user.id, chapter.id)
  const firstTopic = afterOne.topics.find((t) => t.topicId === first.topicId)!
  check('lesson_progress row written',
    (await prisma.lessonProgress.count({ where: { studentUserId: user.id } })) === 1)
  check('topic completion moved above 0', firstTopic.completionPercent > 0,
    `got ${firstTopic.completionPercent}`)
  check('topic_progress row persisted',
    (await prisma.topicProgress.count({ where: { studentUserId: user.id } })) >= 1)
  check('subject_progress row persisted',
    (await prisma.subjectProgress.count({ where: { studentUserId: user.id } })) >= 1)
  check('overall is weighted by lessons, not topics',
    afterOne.overallPercent > 0 && afterOne.overallPercent < 100,
    `got ${afterOne.overallPercent}`)

  // ---- 3. idempotence and no regression ------------------------------------
  console.log('\n=== 3. Re-recording must not corrupt or regress ===')
  const percentAfterOne = firstTopic.completionPercent
  await recordLessonProgress(prisma, user.id, first.id, ProgressStatus.COMPLETED, 60)
  const repeat = await getChapterProgress(prisma, user.id, chapter.id)
  check('completion unchanged on repeat',
    repeat.topics.find((t) => t.topicId === first.topicId)!.completionPercent ===
      percentAfterOne)
  check('still exactly one lesson_progress row',
    (await prisma.lessonProgress.count({ where: { studentUserId: user.id } })) === 1)

  const row = await prisma.lessonProgress.findFirstOrThrow({
    where: { studentUserId: user.id },
  })
  check('time spent accumulated (120 + 60)', row.timeSpentSeconds === 180,
    `got ${row.timeSpentSeconds}`)

  await recordLessonProgress(prisma, user.id, first.id, ProgressStatus.IN_PROGRESS, 0)
  const afterRevisit = await prisma.lessonProgress.findFirstOrThrow({
    where: { studentUserId: user.id },
  })
  check('revisiting a finished lesson does not demote it',
    afterRevisit.status === ProgressStatus.COMPLETED, afterRevisit.status)

  // ---- 4. completing everything -------------------------------------------
  console.log('\n=== 4. Completing every lesson reaches 100% ===')
  for (const lesson of lessons) {
    await recordLessonProgress(prisma, user.id, lesson.id, ProgressStatus.COMPLETED, 30)
  }
  const full = await getChapterProgress(prisma, user.id, chapter.id)
  check('overall is 100%', full.overallPercent === 100, `got ${full.overallPercent}`)
  check('every topic with lessons is complete',
    full.topics.filter((t) => t.lessonCount > 0).every((t) => t.completionPercent === 100))
  check('topics with no lessons stay at 0 rather than dividing by zero',
    full.topics.filter((t) => t.lessonCount === 0).every((t) => t.completionPercent === 0))

  // ---- 5. quiz score feeds topic progress ---------------------------------
  console.log('\n=== 5. A quiz score rolls into its topic ===')
  const quiz = await prisma.quiz.findFirst({
    where: { status: 'PUBLISHED' },
    include: { questions: { include: { question: true } }, components: true },
  })

  if (!quiz || quiz.components.length === 0) {
    console.log('  SKIP  no published quiz attached to a lesson')
  } else {
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentUserId: user.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score: 2,
        maxScore: 5, // 40% — deliberately below the weak threshold
      },
    })
    await recomputeAfterQuiz(prisma, user.id, quiz.id)

    const quizComponent = await prisma.lessonComponent.findFirstOrThrow({
      where: { quizId: quiz.id },
      select: { lesson: { select: { topicId: true } } },
    })
    const withScore = await getChapterProgress(prisma, user.id, chapter.id)
    const scored = withScore.topics.find(
      (t) => t.topicId === quizComponent.lesson.topicId,
    )!

    check('scoreAvg reflects the attempt (40%)', scored.scoreAvg === 40,
      `got ${scored.scoreAvg}`)
    check('attempt counted', scored.attempts === 1, `got ${scored.attempts}`)
    check('a low score flags the topic as weak (FR-018)',
      withScore.weakTopicIds.includes(scored.topicId),
      JSON.stringify(withScore.weakTopicIds))
    check('topics never attempted are not flagged weak',
      withScore.topics
        .filter((t) => t.attempts === 0)
        .every((t) => !withScore.weakTopicIds.includes(t.topicId)))

    // A second, better attempt should raise the average and clear the flag.
    await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        studentUserId: user.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score: 5,
        maxScore: 5,
      },
    })
    await recomputeAfterQuiz(prisma, user.id, quiz.id)
    const improved = await getChapterProgress(prisma, user.id, chapter.id)
    const improvedTopic = improved.topics.find(
      (t) => t.topicId === quizComponent.lesson.topicId,
    )!
    check('average of 40% and 100% is 70%', improvedTopic.scoreAvg === 70,
      `got ${improvedTopic.scoreAvg}`)
    check('improving clears the weak flag',
      !improved.weakTopicIds.includes(improvedTopic.topicId))
    check('recompute is idempotent, not incremental',
      improvedTopic.attempts === 2, `got ${improvedTopic.attempts}`)

    void attempt
  }

  // ---- 6. database constraints still satisfied ----------------------------
  console.log('\n=== 6. Written values satisfy the CHECK constraints ===')
  const topicRows = await prisma.topicProgress.findMany({
    where: { studentUserId: user.id },
  })
  check('all completion percentages within 0..100',
    topicRows.every((r) => Number(r.completionPercent) >= 0 && Number(r.completionPercent) <= 100))
  check('progress rows exist for this student', topicRows.length > 0)

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`)
}

async function cleanup() {
  // Removes only the isolated test user. Cascades take its student row,
  // sessions, progress and attempts. Nothing seeded is touched.
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
  if (!user) return
  await prisma.quizAttempt.deleteMany({ where: { studentUserId: user.id } })
  await prisma.user.delete({ where: { id: user.id } })
  console.log(`Cleaned up test student ${user.id} (${TEST_EMAIL}) and its rows only.`)
}

main()
  .catch((error) => {
    console.error(error)
    fail++
  })
  .finally(async () => {
    await cleanup().catch((e) => console.error('cleanup failed:', e))
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
