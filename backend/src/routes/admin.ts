import { Router } from 'express'
import { z } from 'zod'
import { Prisma, type PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { parseId, publishedOnly } from '../lib/http'
import { requireRole } from '../lib/auth'

/**
 * Administration of teacher assignments.
 *
 * TeacherAssignment is what scopes every teacher-facing query, so writing to it
 * is a privilege operation: an ADMIN grants a teacher access to a class. A
 * teacher cannot create their own assignment, which is the whole point — being
 * able to would let anyone with a teacher account read any class's children.
 */

const assignmentSchema = z.object({
  teacherUserId: z.coerce.number().int().positive(),
  classId: z.coerce.number().int().positive(),
  /** Omit for a homeroom assignment covering every subject in the class. */
  subjectId: z.coerce.number().int().positive().nullish(),
})

export function createAdminRouter(prisma: PrismaClient): Router {
  const router = Router()

  /** Everything an assignment form needs, in one call. */
  router.get(
    '/admin/assignable',
    asyncHandler(async (req, res) => {
      requireRole(req, 'ADMIN')

      const [teachers, classes, subjects] = await Promise.all([
        prisma.teacher.findMany({
          select: {
            userId: true,
            employeeCode: true,
            institution: true,
            user: { select: { name: true, email: true, status: true } },
          },
          orderBy: { userId: 'asc' },
        }),
        prisma.class.findMany({
          where: publishedOnly,
          orderBy: { level: 'asc' },
          select: { id: true, level: true, nameBn: true, nameEn: true },
        }),
        prisma.subject.findMany({
          where: publishedOnly,
          orderBy: { code: 'asc' },
          select: { id: true, code: true, nameBn: true, nameEn: true },
        }),
      ])

      res.json({
        data: {
          teachers: teachers.map((t) => ({
            userId: t.userId,
            name: t.user.name,
            email: t.user.email,
            status: t.user.status,
            employeeCode: t.employeeCode,
            institution: t.institution,
          })),
          classes,
          subjects,
        },
      })
    }),
  )

  router.get(
    '/admin/assignments',
    asyncHandler(async (req, res) => {
      requireRole(req, 'ADMIN')

      const assignments = await prisma.teacherAssignment.findMany({
        include: {
          teacher: { select: { user: { select: { name: true, email: true } } } },
          class: { select: { level: true, nameBn: true, nameEn: true } },
          subject: { select: { nameBn: true, nameEn: true } },
        },
        orderBy: [{ classId: 'asc' }, { teacherUserId: 'asc' }],
      })

      res.json({
        data: assignments.map((a) => ({
          id: a.id,
          teacherUserId: a.teacherUserId,
          teacherName: a.teacher.user.name,
          teacherEmail: a.teacher.user.email,
          classId: a.classId,
          classLevel: a.class.level,
          classNameBn: a.class.nameBn,
          classNameEn: a.class.nameEn,
          subjectId: a.subjectId,
          subjectNameBn: a.subject?.nameBn ?? null,
          subjectNameEn: a.subject?.nameEn ?? null,
          assignedAt: a.assignedAt,
        })),
      })
    }),
  )

  router.post(
    '/admin/assignments',
    asyncHandler(async (req, res) => {
      const admin = requireRole(req, 'ADMIN')

      const parsed = assignmentSchema.safeParse(req.body)
      if (!parsed.success) {
        throw HttpError.badRequest('Invalid assignment', parsed.error.issues)
      }
      const { teacherUserId, classId } = parsed.data
      const subjectId = parsed.data.subjectId ?? null

      // Each referenced row is checked rather than trusted to the foreign key,
      // so a bad id produces a clear 400 instead of a constraint error.
      const teacher = await prisma.teacher.findUnique({
        where: { userId: teacherUserId },
        select: { userId: true },
      })
      if (!teacher) throw HttpError.badRequest('No such teacher')

      const target = await prisma.class.findFirst({
        where: { id: classId, ...publishedOnly },
        select: { id: true },
      })
      if (!target) throw HttpError.badRequest('No such class')

      if (subjectId !== null) {
        const linked = await prisma.classSubject.findUnique({
          where: { classId_subjectId: { classId, subjectId } },
        })
        // Assigning a subject the class does not study would create a scope
        // that silently matches no lessons.
        if (!linked) {
          throw HttpError.badRequest('That subject is not taught in that class')
        }
      }

      try {
        const created = await prisma.teacherAssignment.create({
          data: { teacherUserId, classId, subjectId },
          select: { id: true, assignedAt: true },
        })

        await prisma.auditLog.create({
          data: {
            userId: admin.userId,
            action: 'TEACHER_ASSIGNMENT_CREATED',
            entityType: 'TeacherAssignment',
            entityId: String(created.id),
            metadata: { teacherUserId, classId, subjectId },
          },
        })

        res.status(201).json({ data: created })
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new HttpError(
            409,
            'That teacher already has this assignment',
            'ASSIGNMENT_EXISTS',
          )
        }
        throw error
      }
    }),
  )

  router.delete(
    '/admin/assignments/:assignmentId',
    asyncHandler(async (req, res) => {
      const admin = requireRole(req, 'ADMIN')
      const assignmentId = parseId(req.params.assignmentId, 'assignment')

      const existing = await prisma.teacherAssignment.findUnique({
        where: { id: assignmentId },
        select: { id: true, teacherUserId: true, classId: true, subjectId: true },
      })
      if (!existing) throw HttpError.notFound('Assignment')

      await prisma.teacherAssignment.delete({ where: { id: assignmentId } })

      // Revoking access is worth a record: it changes who could read a class.
      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: 'TEACHER_ASSIGNMENT_REMOVED',
          entityType: 'TeacherAssignment',
          entityId: String(assignmentId),
          metadata: {
            teacherUserId: existing.teacherUserId,
            classId: existing.classId,
            subjectId: existing.subjectId,
          },
        },
      })

      res.json({ data: { removed: assignmentId } })
    }),
  )

  return router
}
