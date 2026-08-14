/**
 * Progress aggregation.
 *
 * Pure functions, no Prisma, so the arithmetic a student's dashboard depends on
 * can be tested directly. The persistence side lives in services/progress.ts.
 *
 * Progress is *derived*, never authored: it is recomputed from lesson
 * completion and quiz attempts every time one of those changes. That is why
 * StudentProgress was split into concrete per-level tables rather than kept as
 * a polymorphic row — see docs/architecture/schema-decisions.md decision 2.
 */

export interface AttemptScore {
  score: number
  maxScore: number
}

/** Percentage of a topic's lessons the student has completed, 0–100. */
export function completionPercent(completed: number, total: number): number {
  if (total <= 0) return 0
  if (completed <= 0) return 0
  const raw = (Math.min(completed, total) / total) * 100
  return round2(raw)
}

/**
 * Mean percentage across attempts, or null when the student has attempted
 * nothing.
 *
 * Null rather than 0: "no quizzes taken" and "took quizzes and scored zero"
 * are different facts, and showing the second when the first is true would
 * discourage a student who has done nothing wrong.
 */
export function averageScorePercent(attempts: AttemptScore[]): number | null {
  const usable = attempts.filter((a) => a.maxScore > 0)
  if (usable.length === 0) return null
  const total = usable.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0)
  return round2(total / usable.length)
}

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export function topicStatus(percent: number): ProgressStatus {
  if (percent <= 0) return 'NOT_STARTED'
  if (percent >= 100) return 'COMPLETED'
  return 'IN_PROGRESS'
}

export interface TopicSnapshot {
  topicId: number
  completionPercent: number
  scoreAvg: number | null
  attempts: number
}

/**
 * Flags topics a student is struggling with, for FR-018.
 *
 * Deliberately narrow: a topic counts as weak only when the student has
 * actually attempted it and scored below the threshold. Topics never started
 * are *not* weak — they are simply unvisited, and conflating the two would fill
 * a beginner's dashboard with red on day one.
 */
export function identifyWeakTopics(
  snapshots: TopicSnapshot[],
  thresholdPercent = 60,
): TopicSnapshot[] {
  return snapshots
    .filter((s) => s.attempts > 0 && s.scoreAvg !== null && s.scoreAvg < thresholdPercent)
    .sort((a, b) => (a.scoreAvg ?? 0) - (b.scoreAvg ?? 0))
}

/** Overall completion across topics, weighted by lesson count, not topic count. */
export function overallCompletion(
  topics: { completionPercent: number; lessonCount: number }[],
): number {
  const totalLessons = topics.reduce((sum, t) => sum + t.lessonCount, 0)
  if (totalLessons === 0) return 0
  const completedLessons = topics.reduce(
    (sum, t) => sum + (t.completionPercent / 100) * t.lessonCount,
    0,
  )
  return round2((completedLessons / totalLessons) * 100)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
