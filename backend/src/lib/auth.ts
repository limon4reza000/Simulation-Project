import type { Request, RequestHandler } from 'express'
import { HttpError } from './errors'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      studentUserId?: number
    }
  }
}

export interface AuthOptions {
  /**
   * When true, an `x-student-id` header is accepted as the caller's identity.
   *
   * This is a DEVELOPMENT SHIM so the activity endpoint can be exercised before
   * real authentication exists. It is trivially spoofable — any caller could
   * write activity rows for any student — so it defaults to OFF and must be
   * switched on explicitly with ALLOW_HEADER_IDENTITY=true.
   *
   * Delete this the moment session auth lands. Do not deploy with it enabled.
   */
  allowHeaderIdentity: boolean
}

export function createAuthContext(options: AuthOptions): RequestHandler {
  return (req, _res, next) => {
    if (!options.allowHeaderIdentity) return next()

    const raw = req.header('x-student-id')
    if (raw) {
      const parsed = Number.parseInt(raw, 10)
      if (Number.isInteger(parsed) && parsed > 0) {
        req.studentUserId = parsed
      }
    }
    next()
  }
}

export function requireStudent(req: Request): number {
  if (!req.studentUserId) {
    throw new HttpError(401, 'Authentication required', 'UNAUTHENTICATED')
  }
  return req.studentUserId
}
