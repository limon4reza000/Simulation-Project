import { Router } from 'express'
import { z } from 'zod'
import { Prisma, type PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { hashPassword } from '../lib/password'
import { createSession, sessionCookieOptions, SESSION_COOKIE } from '../lib/session'
import { RateLimiter } from '../lib/rateLimit'

/**
 * Self-registration for students and teachers.
 *
 * There are two endpoints, not one endpoint with a `role` field, and this is
 * the security-critical part of the design: the role is a constant inside each
 * handler. A client cannot ask to be a teacher, because nothing in the request
 * body is ever consulted to decide the role. Any future third role gets a third
 * endpoint, not a parameter.
 */

/** Classes a student may enrol in. Server-side allowlist, not client-supplied. */
const ENROLLABLE_CLASS_LEVELS = [6, 7, 8, 9, 10] as const

const registrationLimiter = new RateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

const baseFields = {
  name: z.string().trim().min(2, 'Name is too short').max(120),
  email: z.string().trim().toLowerCase().email().max(190),
  // 8 is the floor, not the goal. Length beats composition rules, so there is
  // no "must contain a symbol" requirement to push people toward Passw0rd!.
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
}

const studentSchema = z.object({
  ...baseFields,
  classLevel: z
    // zod v4 spells the missing-value message `error`, not `required_error`.
    .number({ error: 'Please choose your class' })
    .int()
    .refine(
      (level) => (ENROLLABLE_CLASS_LEVELS as readonly number[]).includes(level),
      { message: 'Choose a class between 6 and 10' },
    ),
})

const teacherSchema = z.object({
  ...baseFields,
  institution: z.string().trim().max(180).optional(),
})

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid registration details'
}

/** Stable, unique, human-readable. Derived from the id, so never collides. */
function code(prefix: string, userId: number): string {
  return `${prefix}-${String(userId).padStart(6, '0')}`
}

export function createRegisterRouter(prisma: PrismaClient): Router {
  const router = Router()

  /** Classes offered in the registration form. */
  router.get(
    '/auth/enrollable-classes',
    asyncHandler(async (_req, res) => {
      const classes = await prisma.class.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          level: { in: [...ENROLLABLE_CLASS_LEVELS] },
        },
        orderBy: { level: 'asc' },
        select: { id: true, level: true, nameBn: true, nameEn: true },
      })
      res.json({ data: classes })
    }),
  )

  router.post(
    '/auth/register/student',
    asyncHandler(async (req, res) => {
      const parsed = studentSchema.safeParse(req.body)
      if (!parsed.success) throw HttpError.badRequest(firstIssue(parsed.error))
      const { name, email, password, classLevel } = parsed.data

      guardRate(req.ip, email)

      // The class must exist and be published — validating only the number
      // would let a request enrol into a class that was withdrawn.
      const target = await prisma.class.findFirst({
        where: { level: classLevel, status: 'PUBLISHED', deletedAt: null },
        select: { id: true },
      })
      if (!target) {
        throw HttpError.badRequest('That class is not available for registration')
      }

      const user = await createAccount(prisma, {
        name,
        email,
        password,
        roleCode: 'STUDENT', // constant, never from the request
        attach: (tx, userId) =>
          tx.student.create({
            data: {
              userId,
              classId: target.id,
              studentCode: code('S', userId),
            },
          }),
      })

      await issueSession(prisma, req, res, user.id)
      res.status(201).json({
        data: {
          userId: user.id,
          name: user.name,
          roleCode: 'STUDENT',
          preferredLanguage: user.preferredLanguage,
          isStudent: true,
          classLevel,
        },
      })
    }),
  )

  router.post(
    '/auth/register/teacher',
    asyncHandler(async (req, res) => {
      const parsed = teacherSchema.safeParse(req.body)
      if (!parsed.success) throw HttpError.badRequest(firstIssue(parsed.error))
      const { name, email, password, institution } = parsed.data

      guardRate(req.ip, email)

      const user = await createAccount(prisma, {
        name,
        email,
        password,
        roleCode: 'TEACHER', // constant, never from the request
        attach: (tx, userId) =>
          tx.teacher.create({
            data: {
              userId,
              employeeCode: code('T', userId),
              institution: institution || null,
            },
          }),
      })

      await issueSession(prisma, req, res, user.id)
      res.status(201).json({
        data: {
          userId: user.id,
          name: user.name,
          roleCode: 'TEACHER',
          preferredLanguage: user.preferredLanguage,
          isStudent: false,
          institution: institution ?? null,
        },
      })
    }),
  )

  return router

  function guardRate(ip: string | undefined, email: string) {
    const key = `${ip ?? 'unknown'}:${email}`
    if (registrationLimiter.isBlocked(key)) {
      throw new HttpError(
        429,
        'Too many registration attempts. Try again later.',
        'TOO_MANY_ATTEMPTS',
      )
    }
    registrationLimiter.recordFailure(key)
  }
}

interface CreateAccountInput {
  name: string
  email: string
  password: string
  roleCode: 'STUDENT' | 'TEACHER'
  attach: (tx: Prisma.TransactionClient, userId: number) => Promise<unknown>
}

/**
 * Creates the user and its role-specific row atomically.
 *
 * A transaction matters here: a User with no Student row would be able to log
 * in but not do anything, and would be invisible to any query that joins
 * through Student.
 */
async function createAccount(prisma: PrismaClient, input: CreateAccountInput) {
  const role = await prisma.role.findUnique({ where: { code: input.roleCode } })
  if (!role) {
    throw new HttpError(500, 'Roles are not seeded', 'ROLE_MISSING')
  }

  const passwordHash = await hashPassword(input.password)

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          roleId: role.id,
          name: input.name,
          email: input.email,
          passwordHash,
        },
        select: { id: true, name: true, preferredLanguage: true },
      })
      await input.attach(tx, user.id)
      return user
    })
  } catch (error) {
    // P2002 is the unique constraint on email. Reported plainly because the
    // person is trying to create the account, so "this email is taken" tells
    // them nothing they could not learn by trying to log in.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new HttpError(409, 'An account with that email already exists', 'EMAIL_TAKEN')
    }
    throw error
  }
}

async function issueSession(
  prisma: PrismaClient,
  req: { get(name: string): string | undefined },
  res: { cookie(name: string, value: string, options: object): unknown },
  userId: number,
) {
  const { token, expiresAt } = await createSession(
    prisma,
    userId,
    req.get('user-agent') ?? undefined,
  )
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))
}
