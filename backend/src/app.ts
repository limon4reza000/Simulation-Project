import express, { type Express } from 'express'
import cors from 'cors'
import type { PrismaClient } from '@prisma/client'
import { errorHandler, notFoundHandler } from './lib/errors'
import { createAuthContext } from './lib/auth'
import { createCatalogRouter } from './routes/catalog'
import { createLessonRouter } from './routes/lessons'
import { createActivityRouter } from './routes/activity'

export interface AppOptions {
  prisma: PrismaClient
  /** See AuthOptions — development shim, defaults to off. */
  allowHeaderIdentity?: boolean
  corsOrigins?: string[]
}

/**
 * Builds the Express app around an injected Prisma client.
 *
 * Injection rather than a module-level singleton is what lets the whole API be
 * tested without a database: the suite passes a hand-rolled stub. That is worth
 * more than the small ceremony it costs, given MySQL is not yet stood up.
 */
export function createApp({
  prisma,
  allowHeaderIdentity = process.env.ALLOW_HEADER_IDENTITY === 'true',
  corsOrigins,
}: AppOptions): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined))
  // Lesson activity payloads are tiny; a small cap limits the damage from a
  // malformed or hostile client.
  app.use(express.json({ limit: '32kb' }))
  app.use(createAuthContext({ allowHeaderIdentity }))

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok', time: new Date().toISOString() } })
  })

  app.use('/api', createCatalogRouter(prisma))
  app.use('/api', createLessonRouter(prisma))
  app.use('/api', createActivityRouter(prisma))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
