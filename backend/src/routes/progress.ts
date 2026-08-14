import { Router } from 'express'
import { z } from 'zod'
import { ProgressStatus, type PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { parseId, publishedOnly } from '../lib/http'
import { requireStudent } from '../lib/auth'
import { recordLessonProgress, getChapterProgress } from '../services/progress'

/**
 * A student's own progress.
 *
 * Every route derives the student from the session — none accepts a student id
 * from the caller. A student can therefore only ever read or write their own
 * progress, and there is no parameter to forget to check. Teacher-facing views
 * over other students will be separate routes gated on TeacherAssignment.
 */

const recordSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
  // Clamped hard: a client-supplied duration is not evidence, and an absurd
  // value would poison the time-spent aggregate for the whole topic.
  timeSpentSeconds: z.coerce.number().int().min(0).max(4 * 60 * 60).optional(),
})

export function createProgressRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.post(
    '/lessons/:lessonId/progress',
    asyncHandler(async (req, res) => {
      const lessonId = parseId(req.params.lessonId, 'lesson')
      const studentUserId = requireStudent(req)

      const parsed = recordSchema.safeParse(req.body)
      if (!parsed.success) {
        throw HttpError.badRequest('Invalid progress payload', parsed.error.issues)
      }

      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, ...publishedOnly },
        select: { id: true },
      })
      if (!lesson) throw HttpError.notFound('Lesson')

      await recordLessonProgress(
        prisma,
        studentUserId,
        lessonId,
        parsed.data.status === 'COMPLETED'
          ? ProgressStatus.COMPLETED
          : ProgressStatus.IN_PROGRESS,
        parsed.data.timeSpentSeconds ?? 0,
      )

      const progress = await prisma.lessonProgress.findUnique({
        where: { studentUserId_lessonId: { studentUserId, lessonId } },
        select: { status: true, completedAt: true, timeSpentSeconds: true },
      })

      res.json({ data: progress })
    }),
  )

  router.get(
    '/chapters/:chapterId/progress',
    asyncHandler(async (req, res) => {
      const chapterId = parseId(req.params.chapterId, 'chapter')
      const studentUserId = requireStudent(req)

      const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, ...publishedOnly },
        select: { id: true },
      })
      if (!chapter) throw HttpError.notFound('Chapter')

      res.json({
        data: await getChapterProgress(prisma, studentUserId, chapterId),
      })
    }),
  )

  return router
}
