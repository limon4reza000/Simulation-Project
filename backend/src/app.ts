import express, { type Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import type { PrismaClient } from '@prisma/client'
import { errorHandler, notFoundHandler } from './lib/errors'
import { createAuthContext } from './lib/auth'
import { createAuthRouter } from './routes/auth'
import { createCatalogRouter } from './routes/catalog'
import { createLessonRouter } from './routes/lessons'
import { createActivityRouter } from './routes/activity'
import { createQuizRouter } from './routes/quizzes'
import { createProgressRouter } from './routes/progress'
import { createRegisterRouter } from './routes/register'
import { createTeacherRouter } from './routes/teacher'

export interface AppOptions {
  prisma: PrismaClient
  /**
   * Origins allowed to send credentialed requests. Required for cookies:
   * a wildcard origin cannot be combined with credentials, and should not be.
   */
  corsOrigins?: string[]
}

/**
 * Builds the Express app around an injected Prisma client.
 *
 * Injection rather than a module-level singleton is what lets the API be tested
 * without a database. Identity comes from a session cookie resolved against the
 * session table — there is no header-based identity shim any more.
 */
export function createApp({
  prisma,
  corsOrigins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? [
    'http://localhost:5173',
  ],
}: AppOptions): Express {
  const app = express()

  app.disable('x-powered-by')
  // Correct client IP behind a proxy, so the login limiter keys on the caller
  // rather than on the proxy.
  app.set('trust proxy', 1)

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true, // required for the session cookie to cross origins
    }),
  )
  app.use(cookieParser())
  // Lesson and quiz payloads are small; a low cap limits the damage from a
  // malformed or hostile client.
  app.use(express.json({ limit: '32kb' }))
  app.use(createAuthContext(prisma))

  app.get('/api/health', (_req, res) => {
    res.json({ data: { status: 'ok', time: new Date().toISOString() } })
  })

  app.use('/api', createAuthRouter(prisma))
  app.use('/api', createRegisterRouter(prisma))
  app.use('/api', createTeacherRouter(prisma))
  app.use('/api', createCatalogRouter(prisma))
  app.use('/api', createLessonRouter(prisma))
  app.use('/api', createActivityRouter(prisma))
  app.use('/api', createQuizRouter(prisma))
  app.use('/api', createProgressRouter(prisma))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
