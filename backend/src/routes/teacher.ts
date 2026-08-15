import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../lib/errors'
import { requireRole } from '../lib/auth'

/**
 * Teacher-only routes.
 *
 * Every handler starts with requireRole(req, 'TEACHER'). A student session
 * reaching any of these gets 403, not a filtered-but-successful response —
 * returning an empty list to an unauthorised caller would hide the fact that
 * the guard was missing.
 *
 * Scope is drawn from TeacherAssignment, so a teacher sees only the classes an
 * administrator has actually assigned them, never every student in the system.
 */
export function createTeacherRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.get(
    '/teacher/overview',
    asyncHandler(async (req, res) => {
      const teacher = requireRole(req, 'TEACHER')

      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherUserId: teacher.userId },
        include: {
          class: { select: { id: true, level: true, nameBn: true, nameEn: true } },
          subject: { select: { id: true, nameBn: true, nameEn: true } },
        },
        orderBy: { classId: 'asc' },
      })

      const classIds = assignments.map((a) => a.classId)

      // Only students in assigned classes are counted. With no assignments this
      // is an empty list, which is the correct answer for a newly registered
      // teacher — not "all students".
      const students = classIds.length
        ? await prisma.student.groupBy({
            by: ['classId'],
            where: { classId: { in: classIds } },
            _count: { userId: true },
          })
        : []

      const countByClass = new Map(students.map((s) => [s.classId, s._count.userId]))

      const profile = await prisma.teacher.findUnique({
        where: { userId: teacher.userId },
        select: { employeeCode: true, institution: true },
      })

      res.json({
        data: {
          name: teacher.name,
          employeeCode: profile?.employeeCode ?? null,
          institution: profile?.institution ?? null,
          assignments: assignments.map((a) => ({
            classId: a.classId,
            classLevel: a.class.level,
            classNameBn: a.class.nameBn,
            classNameEn: a.class.nameEn,
            subjectId: a.subjectId,
            subjectNameBn: a.subject?.nameBn ?? null,
            subjectNameEn: a.subject?.nameEn ?? null,
            studentCount: countByClass.get(a.classId) ?? 0,
          })),
          totalStudents: [...countByClass.values()].reduce((a, b) => a + b, 0),
        },
      })
    }),
  )

  return router
}
