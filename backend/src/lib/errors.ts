import type { NextFunction, Request, RequestHandler, Response } from 'express'

/** An error carrying the status code it should produce. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }

  static notFound(what: string) {
    return new HttpError(404, `${what} not found`, 'NOT_FOUND')
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, message, 'BAD_REQUEST', details)
  }
}

/**
 * Forwards rejected promises to the error middleware.
 *
 * Express 4 does not await handlers, so without this an async throw becomes an
 * unhandled rejection and the request hangs until it times out.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }

  // Never leak an internal message or stack to a client. Students are the
  // audience; the detail belongs in the server log.
  console.error('Unhandled error:', error)
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Something went wrong' },
  })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'No such endpoint' },
  })
}
