import { ProgressStatus, type Prisma, type PrismaClient } from '@prisma/client'
import { averageScorePercent, completionPercent } from '../lib/progress'

/**
 * Class rosters for teachers.
 *
 * Scope is drawn from TeacherAssignment and nowhere else. The class id arrives
 * from the URL, so the assignment lookup is the authorisation check: no
 * assignment, no roster. Filtering the response after fetching would be the
 * wrong shape — it would mean the query had already read children the caller
 * has no business seeing.
 */

const published = { status: 'PUBLISHED', deletedAt: null } as const

export interface RosterStudent {
  studentUserId: number
  name: string
  studentCode: string | null
  completedLessons: number
  completionPercent: number
  scoreAvg: number | null
  attempts: number
  lastActivityAt: string | null
}

export interface ClassRoster {
  classId: number
  classLevel: number
  classNameBn: string
  classNameEn: string
  subjectId: number | null
  subjectNameBn: string | null
  subjectNameEn: string | null
  totalLessons: number
  students: RosterStudent[]
}

/**
 * Returns the roster, or null when the teacher has no assignment covering the
 * class. Null rather than an empty list: "not yours" and "nobody enrolled" are
 * different answers and the route maps them to different statuses.
 */
export async function getClassRoster(
  prisma: PrismaClient,
  teacherUserId: number,
  classId: number,
): Promise<ClassRoster | null> {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { teacherUserId, classId },
    include: {
      class: { select: { id: true, level: true, nameBn: true, nameEn: true } },
      subject: { select: { id: true, nameBn: true, nameEn: true } },
    },
  })
  if (!assignment) return null

  // A subject-specific assignment sees only that subject's lessons; a homeroom
  // assignment (subjectId null) sees every subject linked to the class.
  const topicFilter: Prisma.TopicWhereInput = assignment.subjectId
    ? { chapter: { subjectId: assignment.subjectId } }
    : { chapter: { subject: { classSubjects: { some: { classId } } } } }

  const lessonScope = { ...published, topic: topicFilter }

  const [students, totalLessons] = await Promise.all([
    prisma.student.findMany({
      where: { classId },
      select: {
        userId: true,
        studentCode: true,
        user: { select: { name: true } },
      },
      orderBy: { userId: 'asc' },
    }),
    prisma.lesson.count({ where: lessonScope }),
  ])

  const ids = students.map((s) => s.userId)

  if (ids.length === 0) {
    return shape(assignment, totalLessons, [])
  }

  const [completedRows, activityRows, attemptRows] = await Promise.all([
    prisma.lessonProgress.groupBy({
      by: ['studentUserId'],
      where: {
        studentUserId: { in: ids },
        status: ProgressStatus.COMPLETED,
        lesson: lessonScope,
      },
      _count: { lessonId: true },
    }),
    prisma.lessonProgress.groupBy({
      by: ['studentUserId'],
      where: { studentUserId: { in: ids }, lesson: lessonScope },
      _max: { lastActivityAt: true },
    }),
    // Averaged in JS rather than by the database: attempts have different
    // maximum marks, so a mean of raw scores would weight a 20-mark quiz the
    // same as a 5-mark one.
    prisma.quizAttempt.findMany({
      where: { studentUserId: { in: ids }, status: 'SUBMITTED' },
      select: { studentUserId: true, score: true, maxScore: true },
    }),
  ])

  const completedBy = new Map(
    completedRows.map((r) => [r.studentUserId, r._count.lessonId]),
  )
  const lastBy = new Map(
    activityRows.map((r) => [r.studentUserId, r._max.lastActivityAt]),
  )
  const attemptsBy = new Map<number, { score: number; maxScore: number }[]>()
  for (const row of attemptRows) {
    const list = attemptsBy.get(row.studentUserId) ?? []
    list.push({ score: Number(row.score ?? 0), maxScore: Number(row.maxScore ?? 0) })
    attemptsBy.set(row.studentUserId, list)
  }

  const roster: RosterStudent[] = students.map((student) => {
    const completed = completedBy.get(student.userId) ?? 0
    const attempts = attemptsBy.get(student.userId) ?? []
    const last = lastBy.get(student.userId) ?? null
    return {
      studentUserId: student.userId,
      name: student.user.name,
      studentCode: student.studentCode,
      completedLessons: completed,
      completionPercent: completionPercent(completed, totalLessons),
      scoreAvg: averageScorePercent(attempts),
      attempts: attempts.length,
      lastActivityAt: last ? last.toISOString() : null,
    }
  })

  return shape(assignment, totalLessons, roster)
}

type AssignmentRow = {
  class: { id: number; level: number; nameBn: string; nameEn: string }
  subjectId: number | null
  subject: { id: number; nameBn: string; nameEn: string } | null
}

function shape(
  assignment: AssignmentRow,
  totalLessons: number,
  students: RosterStudent[],
): ClassRoster {
  return {
    classId: assignment.class.id,
    classLevel: assignment.class.level,
    classNameBn: assignment.class.nameBn,
    classNameEn: assignment.class.nameEn,
    subjectId: assignment.subjectId,
    subjectNameBn: assignment.subject?.nameBn ?? null,
    subjectNameEn: assignment.subject?.nameEn ?? null,
    totalLessons,
    students,
  }
}
