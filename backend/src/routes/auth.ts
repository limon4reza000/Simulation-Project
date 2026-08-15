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
import { RateLimiter } from '../lib/rateLimit'

/**
 * Session authentication.
 *
 * Replaces the `x-student-id` development shim, which trusted a header and was
 * therefore trivially spoofable.
 */

const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(200),
  /** Extends the session lifetime. Defaults to off — the shorter, safer one. */
  rememberMe: z.boolean().optional(),
})

/**
 * Brute-force limiter for login. Shared implementation with registration; see
 * lib/rateLimit.ts for the multi-instance caveat.
 */
const loginLimiter = new RateLimiter({ max: 8, windowMs: 10 * 60 * 1000 })

const tooManyAttempts = (key: string) => loginLimiter.isBlocked(key)
const recordFailure = (key: string) => loginLimiter.recordFailure(key)
const clearFailures = (key: string) => loginLimiter.clear(key)

export function createAuthRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.post(
    '/auth/login',
    asyncHandler(async (req, res) => {
      const parsed = loginSchema.safeParse(req.body)
      if (!parsed.success) {
        throw HttpError.badRequest('Email and password are required')
      }
      const { email, password, rememberMe } = parsed.data
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
        rememberMe === true,
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
