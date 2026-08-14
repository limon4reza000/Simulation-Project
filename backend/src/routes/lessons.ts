import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { parseId, parseLanguage, publishedOnly } from '../lib/http'
import { lessonDetailInclude, mapLesson } from '../mappers/lesson'

/**
 * Lesson detail — the endpoint the renderers actually consume.
 *
 * Returns the LessonSpec shape defined in frontend/src/registry/types.ts, so
 * `GET /api/lessons/:id` is a drop-in replacement for the fixtures in
 * frontend/src/data/chapter01.ts.
 */
export function createLessonRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.get(
    '/lessons/:lessonId',
    asyncHandler(async (req, res) => {
      const lessonId = parseId(req.params.lessonId, 'lesson')
      const language = parseLanguage(req.query.lang)

      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, ...publishedOnly },
        include: lessonDetailInclude,
      })

      if (!lesson) throw HttpError.notFound('Lesson')

      res.json({ data: mapLesson(lesson, language) })
    }),
  )

  return router
}
