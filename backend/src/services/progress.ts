import { ProgressStatus, type PrismaClient } from '@prisma/client'
import {
  completionPercent,
  averageScorePercent,
  overallCompletion,
  identifyWeakTopics,
  type TopicSnapshot,
} from '../lib/progress'

/**
 * Persists derived progress.
 *
 * Progress is recomputed from source rows (lesson completion, submitted quiz
 * attempts) rather than incremented in place. Counters that are incremented
 * drift the moment anything is retried, republished or deleted; recomputing is
 * a little more work per write and is always correct.
 */

const published = { status: 'PUBLISHED', deletedAt: null } as const

/** Marks a lesson started or finished, then rolls the change upward. */
export async function recordLessonProgress(
  prisma: PrismaClient,
  studentUserId: number,
  lessonId: number,
  status: ProgressStatus,
  timeSpentSeconds = 0,
): Promise<void> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, ...published },
    select: { id: true, topicId: true, topic: { select: { chapter: { select: { subjectId: true } } } } },
  })
  if (!lesson) return

  const existing = await prisma.lessonProgress.findUnique({
    where: { studentUserId_lessonId: { studentUserId, lessonId } },
    select: { timeSpentSeconds: true, status: true },
  })

  // Never walk a lesson backwards: revisiting a finished lesson must not
  // demote it to IN_PROGRESS and undo the student's progress bar.
  const nextStatus =
    existing?.status === ProgressStatus.COMPLETED ? ProgressStatus.COMPLETED : status

  await prisma.lessonProgress.upsert({
    where: { studentUserId_lessonId: { studentUserId, lessonId } },
    update: {
      status: nextStatus,
      timeSpentSeconds: (existing?.timeSpentSeconds ?? 0) + Math.max(0, timeSpentSeconds),
      ...(nextStatus === ProgressStatus.COMPLETED && existing?.status !== ProgressStatus.COMPLETED
        ? { completedAt: new Date() }
        : {}),
    },
    create: {
      studentUserId,
      lessonId,
      status,
      timeSpentSeconds: Math.max(0, timeSpentSeconds),
      ...(status === ProgressStatus.COMPLETED ? { completedAt: new Date() } : {}),
    },
  })

  await recomputeTopic(prisma, studentUserId, lesson.topicId)
  await recomputeSubject(prisma, studentUserId, lesson.topic.chapter.subjectId)
}

export async function recomputeTopic(
  prisma: PrismaClient,
  studentUserId: number,
  topicId: number,
): Promise<TopicSnapshot> {
  const [totalLessons, completedLessons, attempts, timeSpent] = await Promise.all([
    prisma.lesson.count({ where: { topicId, ...published } }),
    prisma.lessonProgress.count({
      where: {
        studentUserId,
        status: ProgressStatus.COMPLETED,
        lesson: { topicId, ...published },
      },
    }),
    prisma.quizAttempt.findMany({
      where: {
        studentUserId,
        status: 'SUBMITTED',
        // Quizzes reach a topic only through a lesson component, which is the
        // single path established when Quiz.topicId was removed.
        quiz: { components: { some: { lesson: { topicId } } } },
      },
      select: { score: true, maxScore: true },
    }),
    prisma.lessonProgress.aggregate({
      where: { studentUserId, lesson: { topicId, ...published } },
      _sum: { timeSpentSeconds: true },
    }),
  ])

  const percent = completionPercent(completedLessons, totalLessons)
  const scoreAvg = averageScorePercent(
    attempts.map((a) => ({
      score: Number(a.score ?? 0),
      maxScore: Number(a.maxScore ?? 0),
    })),
  )

  await prisma.topicProgress.upsert({
    where: { studentUserId_topicId: { studentUserId, topicId } },
    update: {
      completionPercent: percent,
      scoreAvg,
      attempts: attempts.length,
      timeSpentSeconds: timeSpent._sum.timeSpentSeconds ?? 0,
    },
    create: {
      studentUserId,
      topicId,
      completionPercent: percent,
      scoreAvg,
      attempts: attempts.length,
      timeSpentSeconds: timeSpent._sum.timeSpentSeconds ?? 0,
    },
  })

  return { topicId, completionPercent: percent, scoreAvg, attempts: attempts.length }
}

export async function recomputeSubject(
  prisma: PrismaClient,
  studentUserId: number,
  subjectId: number,
): Promise<number> {
  const inSubject = { topic: { chapter: { subjectId } } }

  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { ...published, ...inSubject } }),
    prisma.lessonProgress.count({
      where: {
        studentUserId,
        status: ProgressStatus.COMPLETED,
        lesson: { ...published, ...inSubject },
      },
    }),
  ])

  const percent = completionPercent(completed, total)

  await prisma.subjectProgress.upsert({
    where: { studentUserId_subjectId: { studentUserId, subjectId } },
    update: { completionPercent: percent },
    create: { studentUserId, subjectId, completionPercent: percent },
  })

  return percent
}

/**
 * Recomputes every topic a quiz belongs to.
 *
 * Called after a submission, so a score is reflected in the dashboard without
 * the student having to also mark a lesson complete.
 */
export async function recomputeAfterQuiz(
  prisma: PrismaClient,
  studentUserId: number,
  quizId: number,
): Promise<void> {
  const components = await prisma.lessonComponent.findMany({
    where: { quizId },
    select: {
      lesson: {
        select: { topicId: true, topic: { select: { chapter: { select: { subjectId: true } } } } },
      },
    },
  })

  const topicIds = [...new Set(components.map((c) => c.lesson.topicId))]
  const subjectIds = [
    ...new Set(components.map((c) => c.lesson.topic.chapter.subjectId)),
  ]

  for (const topicId of topicIds) {
    await recomputeTopic(prisma, studentUserId, topicId)
  }
  for (const subjectId of subjectIds) {
    await recomputeSubject(prisma, studentUserId, subjectId)
  }
}

export interface ChapterProgressSummary {
  chapterId: number
  overallPercent: number
  topics: {
    topicId: number
    titleBn: string
    titleEn: string
    displayOrder: number
    lessonCount: number
    completedLessons: number
    completionPercent: number
    scoreAvg: number | null
    attempts: number
  }[]
  weakTopicIds: number[]
}

export async function getChapterProgress(
  prisma: PrismaClient,
  studentUserId: number,
  chapterId: number,
): Promise<ChapterProgressSummary> {
  const topics = await prisma.topic.findMany({
    where: { chapterId, ...published },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      titleBn: true,
      titleEn: true,
      displayOrder: true,
      _count: { select: { lessons: { where: published } } },
    },
  })

  const [progressRows, completedCounts] = await Promise.all([
    prisma.topicProgress.findMany({
      where: { studentUserId, topicId: { in: topics.map((t) => t.id) } },
    }),
    prisma.lessonProgress.groupBy({
      by: ['lessonId'],
      where: {
        studentUserId,
        status: ProgressStatus.COMPLETED,
        lesson: { topicId: { in: topics.map((t) => t.id) }, ...published },
      },
    }),
  ])

  const lessonsByTopic = await prisma.lesson.findMany({
    where: { topicId: { in: topics.map((t) => t.id) }, ...published },
    select: { id: true, topicId: true },
  })
  const completedLessonIds = new Set(completedCounts.map((c) => c.lessonId))

  const rows = new Map(progressRows.map((r) => [r.topicId, r]))

  const detailed = topics.map((topic) => {
    const row = rows.get(topic.id)
    const completed = lessonsByTopic.filter(
      (l) => l.topicId === topic.id && completedLessonIds.has(l.id),
    ).length
    return {
      topicId: topic.id,
      titleBn: topic.titleBn,
      titleEn: topic.titleEn,
      displayOrder: topic.displayOrder,
      lessonCount: topic._count.lessons,
      completedLessons: completed,
      completionPercent: Number(row?.completionPercent ?? 0),
      scoreAvg: row?.scoreAvg === null || row?.scoreAvg === undefined ? null : Number(row.scoreAvg),
      attempts: row?.attempts ?? 0,
    }
  })

  const weak = identifyWeakTopics(
    detailed.map((d) => ({
      topicId: d.topicId,
      completionPercent: d.completionPercent,
      scoreAvg: d.scoreAvg,
      attempts: d.attempts,
    })),
  )

  return {
    chapterId,
    overallPercent: overallCompletion(detailed),
    topics: detailed,
    weakTopicIds: weak.map((w) => w.topicId),
  }
}
