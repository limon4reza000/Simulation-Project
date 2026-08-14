import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { parseId, publishedOnly } from '../lib/http'

/**
 * Catalog navigation: Class → Subject → Chapter → Topic → Lesson.
 *
 * Every query filters on `publishedOnly`. Draft and archived content must never
 * reach a student route — the authoring side will get its own endpoints with
 * role checks rather than a `?includeDrafts` flag here, which would be one
 * forgotten guard away from leaking unreviewed material.
 */
export function createCatalogRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.get(
    '/classes',
    asyncHandler(async (_req, res) => {
      const classes = await prisma.class.findMany({
        where: publishedOnly,
        orderBy: { level: 'asc' },
        include: {
          classSubjects: {
            include: { subject: true },
          },
        },
      })

      res.json({
        data: classes.map((cls) => ({
          id: cls.id,
          level: cls.level,
          nameBn: cls.nameBn,
          nameEn: cls.nameEn,
          subjects: cls.classSubjects
            .map((link) => link.subject)
            .filter((subject) => subject.status === 'PUBLISHED' && !subject.deletedAt)
            .map((subject) => ({
              id: subject.id,
              code: subject.code,
              nameBn: subject.nameBn,
              nameEn: subject.nameEn,
            })),
        })),
      })
    }),
  )

  router.get(
    '/subjects/:subjectId/chapters',
    asyncHandler(async (req, res) => {
      const subjectId = parseId(req.params.subjectId, 'subject')

      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, ...publishedOnly },
      })
      if (!subject) throw HttpError.notFound('Subject')

      const chapters = await prisma.chapter.findMany({
        where: { subjectId, ...publishedOnly },
        orderBy: { displayOrder: 'asc' },
      })

      res.json({
        data: chapters.map((chapter) => ({
          id: chapter.id,
          titleBn: chapter.titleBn,
          titleEn: chapter.titleEn,
          displayOrder: chapter.displayOrder,
        })),
      })
    }),
  )

  router.get(
    '/chapters/:chapterId/topics',
    asyncHandler(async (req, res) => {
      const chapterId = parseId(req.params.chapterId, 'chapter')

      const chapter = await prisma.chapter.findFirst({
        where: { id: chapterId, ...publishedOnly },
      })
      if (!chapter) throw HttpError.notFound('Chapter')

      const topics = await prisma.topic.findMany({
        where: { chapterId, ...publishedOnly },
        orderBy: { displayOrder: 'asc' },
        include: {
          lessons: {
            where: publishedOnly,
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              titleBn: true,
              titleEn: true,
              displayOrder: true,
            },
          },
        },
      })

      res.json({
        data: topics.map((topic) => ({
          id: topic.id,
          titleBn: topic.titleBn,
          titleEn: topic.titleEn,
          displayOrder: topic.displayOrder,
          lessons: topic.lessons,
        })),
      })
    }),
  )

  return router
}
