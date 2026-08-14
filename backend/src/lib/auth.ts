import type { Request, RequestHandler } from 'express'
import type { PrismaClient } from '@prisma/client'
import { HttpError } from './errors'
import { resolveSession, SESSION_COOKIE, type SessionUser } from './session'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser
    }
  }
}

/**
 * Populates req.user from the session cookie.
 *
 * This replaced an `x-student-id` header shim that trusted whatever the caller
 * claimed. Nothing here trusts client-supplied identity: the cookie holds a
 * random token, the token is looked up server-side, and the row it resolves to
 * decides who the caller is.
 */
export function createAuthContext(prisma: PrismaClient): RequestHandler {
  return (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined
    if (!token) return next()

    resolveSession(prisma, token)
      .then((user) => {
        if (user) req.user = user
        next()
      })
      .catch(next)
  }
}

export function requireUser(req: Request): SessionUser {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHENTICATED')
  }
  return req.user
}

/**
 * Returns the caller's student id.
 *
 * A teacher or admin has no student record, so endpoints that write learner
 * data reject them rather than silently attributing the row to nobody.
 */
export function requireStudent(req: Request): number {
  const user = requireUser(req)
  if (user.studentUserId === undefined) {
    throw new HttpError(
      403,
      'This action is only available to students',
      'NOT_A_STUDENT',
    )
  }
  return user.studentUserId
}

export function requireRole(req: Request, ...roles: string[]): SessionUser {
  const user = requireUser(req)
  if (!roles.includes(user.roleCode)) {
    throw new HttpError(403, 'Insufficient permissions', 'FORBIDDEN')
  }
  return user
}
