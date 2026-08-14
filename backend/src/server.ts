import { PrismaClient } from '@prisma/client'
import { createApp } from './app'

const prisma = new PrismaClient()

const port = Number.parseInt(process.env.PORT ?? '4000', 10)
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim())

const app = createApp({ prisma, corsOrigins })

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  if (process.env.ALLOW_HEADER_IDENTITY === 'true') {
    console.warn(
      'WARNING: ALLOW_HEADER_IDENTITY is enabled. x-student-id is trusted ' +
        'without verification. Development only — never enable in production.',
    )
  }
})

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`)
  server.close(() => {
    void prisma.$disconnect().then(() => process.exit(0))
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
