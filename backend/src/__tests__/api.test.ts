import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../app'

/**
 * The API is exercised end to end against an injected stub rather than a live
 * database. That keeps the suite runnable before MySQL exists and keeps it fast
 * afterwards; the mapper and route logic under test are the parts that actually
 * carry risk, and they are fully covered here.
 *
 * Fixtures mirror what prisma/seed.ts writes for Physics 9–10 Chapter 1.
 */

const physics = {
  id: 1,
  code: 'PHY',
  nameBn: 'পদার্থবিজ্ঞান',
  nameEn: 'Physics',
  status: 'PUBLISHED',
  deletedAt: null,
}

const draftSubject = {
  id: 2,
  code: 'CHE',
  nameBn: 'রসায়ন',
  nameEn: 'Chemistry',
  status: 'DRAFT',
  deletedAt: null,
}

const caliperLesson = {
  id: 20,
  titleBn: 'ভার্নিয়ার ক্যালিপার্স',
  titleEn: 'Vernier Calipers',
  components: [
    {
      id: 201,
      componentType: 'EXPLANATION',
      displayOrder: 1,
      parameterOverrides: null,
      content: {
        id: 1,
        versions: [
          {
            id: 11,
            body: 'ভার্নিয়ার স্কেল ব্যবহার করে সূক্ষ্মভাবে মাপা যায়।',
            publishedForLanguage: 'BN',
          },
        ],
      },
      visualization: null,
      simulation: null,
      exercise: null,
      quiz: null,
    },
    {
      id: 202,
      componentType: 'SIMULATION',
      displayOrder: 2,
      parameterOverrides: null,
      content: null,
      visualization: null,
      simulation: {
        id: 5,
        type: 'SIM_VERNIER_CALIPER',
        configuration: { maxLengthMm: 60 },
        parameters: [
          { name: 'vernierDivisions', dataType: 'INT', defaultValue: '10' },
          { name: 'mainScaleDivision', dataType: 'FLOAT', defaultValue: '1' },
          { name: 'objectLength', dataType: 'FLOAT', defaultValue: '24.4' },
          { name: 'mode', dataType: 'ENUM', defaultValue: 'explore' },
        ],
      },
      exercise: null,
      quiz: null,
    },
    {
      id: 203,
      componentType: 'SIMULATION',
      displayOrder: 3,
      // Same simulation, different placement — the whole point of the override
      // column added to LessonComponent.
      parameterOverrides: { mode: 'practice' },
      content: null,
      visualization: null,
      simulation: {
        id: 5,
        type: 'SIM_VERNIER_CALIPER',
        configuration: { maxLengthMm: 60 },
        parameters: [
          { name: 'vernierDivisions', dataType: 'INT', defaultValue: '10' },
          { name: 'objectLength', dataType: 'FLOAT', defaultValue: '24.4' },
          { name: 'mode', dataType: 'ENUM', defaultValue: 'explore' },
        ],
      },
      exercise: null,
      quiz: null,
    },
  ],
}

function createStub() {
  return {
    class: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 1,
          level: 9,
          nameBn: 'নবম শ্রেণি',
          nameEn: 'Class 9',
          classSubjects: [{ subject: physics }, { subject: draftSubject }],
        },
      ]),
    },
    subject: { findFirst: vi.fn().mockResolvedValue(physics) },
    chapter: {
      findFirst: vi.fn().mockResolvedValue({ id: 3 }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 3,
          titleBn: 'ভৌত রাশি এবং তাদের পরিমাপ',
          titleEn: 'Physical Quantities and Their Measurement',
          displayOrder: 1,
        },
      ]),
    },
    topic: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 7,
          titleBn: 'পরিমাপের যন্ত্রপাতি',
          titleEn: 'Measuring Instruments',
          displayOrder: 7,
          lessons: [
            { id: 20, titleBn: 'ভার্নিয়ার ক্যালিপার্স', titleEn: 'Vernier Calipers', displayOrder: 1 },
          ],
        },
      ]),
    },
    lesson: { findFirst: vi.fn().mockResolvedValue(caliperLesson) },
    simulation: { findFirst: vi.fn().mockResolvedValue({ id: 5 }) },
    student: { findUnique: vi.fn().mockResolvedValue({ userId: 42 }) },
    learningActivity: {
      create: vi
        .fn()
        .mockResolvedValue({ id: 900, occurredAt: new Date('2026-08-14T00:00:00Z') }),
    },
  }
}

let stub: ReturnType<typeof createStub>

function app(allowHeaderIdentity = true) {
  return createApp({
    prisma: stub as unknown as PrismaClient,
    allowHeaderIdentity,
  })
}

beforeEach(() => {
  stub = createStub()
})

describe('health', () => {
  it('reports ok', async () => {
    const res = await request(app()).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ok')
  })

  it('404s unknown endpoints as JSON, not HTML', async () => {
    const res = await request(app()).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('GET /api/classes', () => {
  it('returns classes with their published subjects', async () => {
    const res = await request(app()).get('/api/classes')
    expect(res.status).toBe(200)
    expect(res.body.data[0].level).toBe(9)
    expect(res.body.data[0].subjects).toHaveLength(1)
    expect(res.body.data[0].subjects[0].code).toBe('PHY')
  })

  it('hides unpublished subjects', async () => {
    const res = await request(app()).get('/api/classes')
    const codes = res.body.data[0].subjects.map((s: { code: string }) => s.code)
    expect(codes).not.toContain('CHE')
  })

  it('queries only published, non-deleted rows', async () => {
    await request(app()).get('/api/classes')
    const where = stub.class.findMany.mock.calls[0][0].where
    expect(where).toMatchObject({ status: 'PUBLISHED', deletedAt: null })
  })
})

describe('GET /api/chapters/:id/topics', () => {
  it('returns topics with their lesson summaries', async () => {
    const res = await request(app()).get('/api/chapters/3/topics')
    expect(res.status).toBe(200)
    expect(res.body.data[0].lessons[0].id).toBe(20)
  })

  it('rejects a non-numeric id', async () => {
    const res = await request(app()).get('/api/chapters/abc/topics')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('404s when the chapter is not published', async () => {
    stub.chapter.findFirst.mockResolvedValue(null)
    const res = await request(app()).get('/api/chapters/999/topics')
    expect(res.status).toBe(404)
  })
})

describe('GET /api/lessons/:id', () => {
  it('returns the LessonSpec shape the renderers consume', async () => {
    const res = await request(app()).get('/api/lessons/20')
    expect(res.status).toBe(200)
    const lesson = res.body.data
    expect(lesson.id).toBe(20)
    expect(lesson.components).toHaveLength(3)
    expect(lesson.components[0].bodyBn).toContain('ভার্নিয়ার')
    expect(lesson.components[1].rendererType).toBe('SIM_VERNIER_CALIPER')
  })

  it('coerces SimulationParameter strings to their declared types', async () => {
    const res = await request(app()).get('/api/lessons/20')
    const params = res.body.data.components[1].parameters
    // Stored as text in the database; the renderer needs real numbers.
    expect(params.vernierDivisions).toBe(10)
    expect(params.objectLength).toBe(24.4)
    expect(params.mode).toBe('explore')
    expect(typeof params.vernierDivisions).toBe('number')
  })

  it('lets placement overrides win over simulation defaults', async () => {
    const res = await request(app()).get('/api/lessons/20')
    const explore = res.body.data.components[1].parameters
    const practice = res.body.data.components[2].parameters
    expect(explore.mode).toBe('explore')
    expect(practice.mode).toBe('practice')
    // Non-overridden defaults survive.
    expect(practice.objectLength).toBe(24.4)
  })

  it('passes the simulation configuration through', async () => {
    const res = await request(app()).get('/api/lessons/20')
    expect(res.body.data.components[1].config).toEqual({ maxLengthMm: 60 })
  })

  it('exposes simulationId so the client can target the activity endpoint', async () => {
    const res = await request(app()).get('/api/lessons/20')
    expect(res.body.data.components[1].simulationId).toBe(5)
    // Prose components have no simulation to report against.
    expect(res.body.data.components[0].simulationId).toBeUndefined()
  })

  it('falls back to an available language rather than an empty lesson', async () => {
    // Only a Bangla version exists; an English request must still show prose.
    const res = await request(app()).get('/api/lessons/20?lang=en')
    expect(res.status).toBe(200)
    expect(res.body.data.components[0].bodyEn).toBeTruthy()
  })

  it('defaults to Bangla when no lang is given', async () => {
    await request(app()).get('/api/lessons/20')
    expect(stub.lesson.findFirst).toHaveBeenCalled()
    const res = await request(app()).get('/api/lessons/20')
    expect(res.body.data.components[0].bodyBn).toBeTruthy()
  })

  it('404s an unpublished lesson', async () => {
    stub.lesson.findFirst.mockResolvedValue(null)
    const res = await request(app()).get('/api/lessons/20')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/simulations/:id/activity', () => {
  const url = '/api/simulations/5/activity'

  it('records an activity for an identified student', async () => {
    const res = await request(app())
      .post(url)
      .set('x-student-id', '42')
      .send({ activityType: 'VERNIER_ANSWER_SUBMITTED', metadata: { correct: true } })

    expect(res.status).toBe(201)
    expect(stub.learningActivity.create).toHaveBeenCalledOnce()
    expect(stub.learningActivity.create.mock.calls[0][0].data).toMatchObject({
      studentUserId: 42,
      activityType: 'VERNIER_ANSWER_SUBMITTED',
    })
  })

  it('rejects an unauthenticated caller', async () => {
    const res = await request(app()).post(url).send({ activityType: 'X_Y' })
    expect(res.status).toBe(401)
    expect(stub.learningActivity.create).not.toHaveBeenCalled()
  })

  it('ignores x-student-id when the dev shim is disabled', async () => {
    // Secure by default: the header is only trusted when explicitly enabled.
    const res = await request(app(false))
      .post(url)
      .set('x-student-id', '42')
      .send({ activityType: 'VERNIER_ANSWER_SUBMITTED' })
    expect(res.status).toBe(401)
  })

  it('rejects a free-text activityType', async () => {
    const res = await request(app())
      .post(url)
      .set('x-student-id', '42')
      .send({ activityType: 'some arbitrary note about the child' })
    expect(res.status).toBe(400)
  })

  it('caps metadata breadth — data minimisation is enforced server-side', async () => {
    const metadata = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`k${i}`, i]),
    )
    const res = await request(app())
      .post(url)
      .set('x-student-id', '42')
      .send({ activityType: 'VERNIER_ANSWER_SUBMITTED', metadata })
    expect(res.status).toBe(400)
    expect(stub.learningActivity.create).not.toHaveBeenCalled()
  })

  it('rejects nested metadata objects', async () => {
    const res = await request(app())
      .post(url)
      .set('x-student-id', '42')
      .send({
        activityType: 'VERNIER_ANSWER_SUBMITTED',
        metadata: { nested: { name: 'a child', school: 'somewhere' } },
      })
    expect(res.status).toBe(400)
  })

  it('404s an unknown simulation', async () => {
    stub.simulation.findFirst.mockResolvedValue(null)
    const res = await request(app())
      .post(url)
      .set('x-student-id', '42')
      .send({ activityType: 'VERNIER_ANSWER_SUBMITTED' })
    expect(res.status).toBe(404)
  })

  it('404s when the student does not exist', async () => {
    stub.student.findUnique.mockResolvedValue(null)
    const res = await request(app())
      .post(url)
      .set('x-student-id', '999')
      .send({ activityType: 'VERNIER_ANSWER_SUBMITTED' })
    expect(res.status).toBe(404)
  })
})

describe('error handling', () => {
  it('does not leak internal error detail to the client', async () => {
    stub.lesson.findFirst.mockRejectedValue(new Error('SECRET connection string'))
    const res = await request(app()).get('/api/lessons/20')
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('SECRET')
    expect(res.body.error.message).toBe('Something went wrong')
  })
})
