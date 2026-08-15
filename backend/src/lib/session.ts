import { createHash, randomBytes } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'

/**
 * Server-side sessions.
 *
 * The cookie carries a high-entropy random token; the database stores only its
 * SHA-256. A dump of the session table therefore does not let anyone
 * impersonate a user, exactly as a dump of the user table does not reveal
 * passwords.
 *
 * SHA-256 rather than scrypt here is deliberate and not an inconsistency:
 * the token is 256 bits of randomness, so there is no dictionary to slow down.
 * Passwords need a slow KDF because humans choose them; tokens do not.
 */

export const SESSION_COOKIE = 'ilsp_session'

/** Long enough for a school day plus a commute; short enough to limit theft. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

/**
 * "Remember me" lifetime.
 *
 * Longer, but still bounded — a session that never expires is a credential
 * with no revocation date. Thirty days means a shared or lost device stops
 * being a way in within a month even if nobody thinks to sign out.
 */
const REMEMBERED_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Refresh lastSeenAt at most this often, to avoid a write per request. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface SessionUser {
  userId: number
  roleCode: string
  studentUserId?: number
  name: string
  preferredLanguage: string
}

export async function createSession(
  prisma: PrismaClient,
  userId: number,
  userAgent?: string,
  remember = false,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const expiresAt = new Date(
    Date.now() + (remember ? REMEMBERED_TTL_MS : SESSION_TTL_MS),
  )

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      // Truncated: enough to notice a session used from somewhere unexpected,
      // not enough to build a profile of a child's device.
      userAgent: userAgent?.slice(0, 180),
    },
  })

  return { token, expiresAt }
}

/**
 * Resolves a raw token to its user, or null.
 *
 * Expired sessions are deleted on sight rather than merely ignored, so the
 * table does not grow without bound and a leaked-but-expired token cannot be
 * revived by clock skew.
 */
export async function resolveSession(
  prisma: PrismaClient,
  token: string,
): Promise<SessionUser | null> {
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { role: true, student: { select: { userId: true } } },
      },
    },
  })

  if (!session) return null

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  // A suspended or disabled account must lose access immediately, without
  // waiting for its sessions to expire. This is the main reason sessions are
  // rows rather than self-contained tokens.
  if (session.user.status !== 'ACTIVE') {
    await prisma.session.deleteMany({ where: { userId: session.userId } })
    return null
  }

  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {})
  }

  return {
    userId: session.userId,
    roleCode: session.user.role.code,
    studentUserId: session.user.student?.userId,
    name: session.user.name,
    preferredLanguage: session.user.preferredLanguage,
  }
}

export async function revokeSession(
  prisma: PrismaClient,
  token: string,
): Promise<void> {
  if (!token) return
  await prisma.session
    .deleteMany({ where: { tokenHash: hashToken(token) } })
    .catch(() => {})
}

export async function revokeAllSessionsForUser(
  prisma: PrismaClient,
  userId: number,
): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { userId } })
  return count
}

/** Cookie attributes. Kept in one place so login and logout cannot disagree. */
export function sessionCookieOptions(expiresAt?: Date) {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true, // JavaScript must not be able to read the session token
    sameSite: 'lax' as const, // blocks the cross-site form-post CSRF shape
    secure, // HTTPS-only outside development
    path: '/',
    ...(expiresAt ? { expires: expiresAt } : {}),
  }
}
