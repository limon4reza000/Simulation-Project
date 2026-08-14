import { Router } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { verifyPassword, dummyVerify } from '../lib/password'
import {
  createSession,
  revokeSession,
  revokeAllSessionsForUser,
  sessionCookieOptions,
  SESSION_COOKIE,
} from '../lib/session'
import { requireUser } from '../lib/auth'

/**
 * Session authentication.
 *
 * Replaces the `x-student-id` development shim, which trusted a header and was
 * therefore trivially spoofable.
 */

const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(200),
})

/**
 * Fixed-window brute-force limiter, in memory.
 *
 * Enough to make online password guessing impractical on a single-process
 * deployment. It resets on restart and is per-process, so a multi-instance
 * deployment needs this moved to Redis or the database — noted rather than
 * pretended otherwise.
 */
const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

function tooManyAttempts(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) return false
  return entry.count >= MAX_ATTEMPTS
}

function recordFailure(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count += 1
  }
  // Opportunistic cleanup; this map must not grow without bound.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k)
  }
}

function clearFailures(key: string): void {
  attempts.delete(key)
}

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.post(
    '/auth/login',
    asyncHandler(async (req, res) => {
      const parsed = loginSchema.safeParse(req.body)
      if (!parsed.success) {
        throw HttpError.badRequest('Email and password are required')
      }
      const { email, password } = parsed.data
      const key = `${req.ip ?? 'unknown'}:${email.toLowerCase()}`

      if (tooManyAttempts(key)) {
        throw new HttpError(
          429,
          'Too many attempts. Try again later.',
          'TOO_MANY_ATTEMPTS',
        )
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { role: true, student: { select: { userId: true } } },
      })

      // Burn comparable time when the account does not exist, so latency does
      // not reveal which email addresses are registered.
      if (!user) {
        await dummyVerify()
        recordFailure(key)
        throw new HttpError(401, 'Incorrect email or password', 'INVALID_CREDENTIALS')
      }

      const ok = await verifyPassword(password, user.passwordHash)
      if (!ok) {
        recordFailure(key)
        // Same message and status as "no such user" — never confirm that an
        // address exists to someone who cannot log in as it.
        throw new HttpError(401, 'Incorrect email or password', 'INVALID_CREDENTIALS')
      }

      if (user.status !== 'ACTIVE') {
        recordFailure(key)
        throw new HttpError(403, 'This account is not active', 'ACCOUNT_INACTIVE')
      }

      clearFailures(key)

      const { token, expiresAt } = await createSession(
        prisma,
        user.id,
        req.get('user-agent') ?? undefined,
      )
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt))

      res.json({
        data: {
          userId: user.id,
          name: user.name,
          roleCode: user.role.code,
          preferredLanguage: user.preferredLanguage,
          isStudent: user.student !== null,
        },
      })
    }),
  )

  router.post(
    '/auth/logout',
    asyncHandler(async (req, res) => {
      const token = req.cookies?.[SESSION_COOKIE] as string | undefined
      if (token) await revokeSession(prisma, token)
      // Clear regardless, so a stale or malformed cookie cannot linger.
      res.clearCookie(SESSION_COOKIE, sessionCookieOptions())
      res.json({ data: { ok: true } })
    }),
  )

  router.post(
    '/auth/logout-all',
    asyncHandler(async (req, res) => {
      const user = requireUser(req)
      const count = await revokeAllSessionsForUser(prisma, user.userId)
      res.clearCookie(SESSION_COOKIE, sessionCookieOptions())
      res.json({ data: { revoked: count } })
    }),
  )

  router.get(
    '/auth/me',
    asyncHandler(async (req, res) => {
      const user = requireUser(req)
      res.json({
        data: {
          userId: user.userId,
          name: user.name,
          roleCode: user.roleCode,
          preferredLanguage: user.preferredLanguage,
          isStudent: user.studentUserId !== undefined,
        },
      })
    }),
  )

  return router
}
