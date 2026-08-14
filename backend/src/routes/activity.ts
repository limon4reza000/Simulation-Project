import { Router } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { parseId } from '../lib/http'
import { requireStudent } from '../lib/auth'

/**
 * POST /api/simulations/:id/activity — backs the LearningActivity table.
 *
 * Data minimisation is enforced here rather than left to callers, because the
 * users are children and "we only send what we need" is not a control if the
 * server accepts anything. The metadata schema below is deliberately narrow:
 * a handful of primitive fields, short strings, nothing nested. Widen it only
 * with a stated reason.
 */

const METADATA_MAX_KEYS = 10
const METADATA_MAX_STRING = 120

const metadataValue = z.union([
  z.string().max(METADATA_MAX_STRING),
  z.number().finite(),
  z.boolean(),
])

const activitySchema = z.object({
  activityType: z
    .string()
    .min(1)
    .max(48)
    // Screaming snake case keeps these greppable and stops free-text creeping
    // into what is effectively an enum.
    .regex(/^[A-Z][A-Z0-9_]*$/, 'activityType must be UPPER_SNAKE_CASE'),
  lessonId: z.coerce.number().int().positive().optional(),
  componentId: z.coerce.number().int().positive().optional(),
  metadata: z
    .record(z.string().max(40), metadataValue)
    .refine((value) => Object.keys(value).length <= METADATA_MAX_KEYS, {
      message: `metadata may contain at most ${METADATA_MAX_KEYS} keys`,
    })
    .optional(),
})

export function createActivityRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.post(
    '/simulations/:simulationId/activity',
    asyncHandler(async (req, res) => {
      const simulationId = parseId(req.params.simulationId, 'simulation')
      const studentUserId = requireStudent(req)

      const parsed = activitySchema.safeParse(req.body)
      if (!parsed.success) {
        throw HttpError.badRequest('Invalid activity payload', parsed.error.issues)
      }
      const body = parsed.data

      const simulation = await prisma.simulation.findFirst({
        where: { id: simulationId, status: 'PUBLISHED' },
        select: { id: true },
      })
      if (!simulation) throw HttpError.notFound('Simulation')

      const student = await prisma.student.findUnique({
        where: { userId: studentUserId },
        select: { userId: true },
      })
      if (!student) throw HttpError.notFound('Student')

      const activity = await prisma.learningActivity.create({
        data: {
          studentUserId,
          lessonId: body.lessonId,
          componentId: body.componentId,
          activityType: body.activityType,
          metadata: body.metadata ?? undefined,
        },
        select: { id: true, occurredAt: true },
      })

      res.status(201).json({ data: activity })
    }),
  )

  return router
}
