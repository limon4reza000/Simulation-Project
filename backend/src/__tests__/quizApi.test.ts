import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../app'
import { createHash } from 'node:crypto'

/**
 * Quiz endpoints, exercised against an injected stub.
 *
 * Fixtures use the real নমুনা প্রশ্ন from book p. 29 so the tests read as the
 * thing a student would actually see.
 */

function question(id: number, correct: string[], marks = 1) {
  return {
    marks,
    displayOrder: id,
    question: {
      id,
      type: 'MCQ_SINGLE',
      promptBn: 'কোয়ান্টাম তত্ত্ব প্রথম কে প্রদান করেন?',
      promptEn: 'Who first proposed quantum theory?',
      optionsJson: [
        { key: 'ka', textBn: 'প্ল্যাঙ্ক', textEn: 'Planck' },
        { key: 'kha', textBn: 'আইনস্টাইন', textEn: 'Einstein' },
        { key: 'ga', textBn: 'রাদারফোর্ড', textEn: 'Rutherford' },
        { key: 'gha', textBn: 'হাইজেনবার্গ', textEn: 'Heisenberg' },
      ],
      answerConfig: { correct },
      explanationBn: '১৯০০ সালে ম্যাক্স প্ল্যাঙ্ক কোয়ান্টাম তত্ত্ব দেন।',
      explanationEn: 'Max Planck proposed quantum theory in 1900.',
    },
  }
}

const quiz = {
  id: 3,
  titleBn: 'নমুনা প্রশ্ন',
  titleEn: 'Sample Questions',
  timeLimitSec: null,
  attemptLimit: 2,
  passMark: 1,
  status: 'PUBLISHED',
  questions: [question(1, ['ka']), question(2, ['ga'])],
}

/**
 * Session stub.
 *
 * Identity now comes from a session cookie resolved server-side, so tests
 * provide the session row the middleware will find rather than asserting a
 * header the server once trusted.
 */
const sha = (t: string) => createHash('sha256').update(t).digest('hex')

function sessionFor(userId: number) {
  return {
    id: userId,
    userId,
    expiresAt: new Date(Date.now() + 3_600_000),
    lastSeenAt: new Date(),
    user: {
      status: 'ACTIVE',
      name: 'Test Student',
      preferredLanguage: 'BN',
      role: { code: 'STUDENT' },
      student: { userId },
    },
  }
}

const TOKENS: Record<string, number> = {
  [sha('tok-42')]: 42,
  [sha('tok-99')]: 99,
  [sha('tok-999')]: 999,
}

function sessionStub() {
  return {
    findUnique: vi.fn(({ where }: { where: { tokenHash: string } }) =>
      Promise.resolve(
        TOKENS[where.tokenHash] ? sessionFor(TOKENS[where.tokenHash]) : null,
      ),
    ),
    delete: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
}

function createStub() {
  return {
    session: sessionStub(),
    quiz: {
      findFirst: vi.fn().mockResolvedValue(quiz),
    },
    student: { findUnique: vi.fn().mockResolvedValue({ userId: 42 }) },
    quizAttempt: {
      count: vi.fn().mockResolvedValue(0),
      create: vi
        .fn()
        .mockResolvedValue({ id: 77, startedAt: new Date('2026-08-14') }),
      findUnique: vi.fn().mockResolvedValue({
        id: 77,
        studentUserId: 42,
        status: 'IN_PROGRESS',
        quiz,
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    quizAttemptAnswer: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    $transaction: vi.fn().mockResolvedValue([]),
  }
}

let stub: ReturnType<typeof createStub>
const app = () => createApp({ prisma: stub as unknown as PrismaClient })

beforeEach(() => {
  stub = createStub()
})

describe('GET /api/quizzes/:id', () => {
  it('returns questions with their options', async () => {
    const res = await request(app()).get('/api/quizzes/3')
    expect(res.status).toBe(200)
    expect(res.body.data.questions).toHaveLength(2)
    expect(res.body.data.questions[0].options).toHaveLength(4)
    expect(res.body.data.questions[0].options[0].text).toBe('প্ল্যাঙ্ক')
  })

  it('NEVER leaks the answer key to the student', async () => {
    // The most important assertion in this file. Anything in this body is one
    // devtools panel away from the student sitting the quiz.
    //
    // Note that option keys ("ka", "kha", …) must be present — the student
    // submits one. What must be absent is any signal of *which* is correct, so
    // this asserts an exact field allowlist rather than searching for strings:
    // a future field that leaks the key fails here even if nobody thinks to
    // add an assertion for it.
    const res = await request(app()).get('/api/quizzes/3')

    for (const question of res.body.data.questions) {
      expect(Object.keys(question).sort()).toEqual([
        'displayOrder',
        'id',
        'marks',
        'options',
        'prompt',
        'type',
      ])
      for (const option of question.options) {
        expect(Object.keys(option).sort()).toEqual(['key', 'text'])
      }
    }

    const body = JSON.stringify(res.body)
    expect(body).not.toContain('answerConfig')
    expect(body).not.toContain('explanation')
  })

  it('serves prompts in the requested language', async () => {
    const res = await request(app()).get('/api/quizzes/3?lang=en')
    expect(res.body.data.questions[0].prompt).toBe(
      'Who first proposed quantum theory?',
    )
    expect(res.body.data.questions[0].options[0].text).toBe('Planck')
  })

  it('404s an unpublished quiz', async () => {
    stub.quiz.findFirst.mockResolvedValue(null)
    const res = await request(app()).get('/api/quizzes/3')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/quizzes/:id/attempts', () => {
  it('starts an attempt for an identified student', async () => {
    const res = await request(app())
      .post('/api/quizzes/3/attempts')
      .set('Cookie', ['ilsp_session=tok-42'])
    expect(res.status).toBe(201)
    expect(res.body.data.id).toBe(77)
  })

  it('requires authentication', async () => {
    const res = await request(app()).post('/api/quizzes/3/attempts')
    expect(res.status).toBe(401)
  })

  it('enforces the attempt limit', async () => {
    stub.quizAttempt.count.mockResolvedValue(2) // limit is 2
    const res = await request(app())
      .post('/api/quizzes/3/attempts')
      .set('Cookie', ['ilsp_session=tok-42'])
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('ATTEMPT_LIMIT_REACHED')
    expect(stub.quizAttempt.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/attempts/:id/submit', () => {
  const url = '/api/attempts/77/submit'

  it('grades a fully correct submission', async () => {
    const res = await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-42'])
      .send({ responses: { '1': 'ka', '2': 'ga' } })

    expect(res.status).toBe(200)
    expect(res.body.data.score).toBe(2)
    expect(res.body.data.maxScore).toBe(2)
    expect(res.body.data.results.every((r: { correct: boolean }) => r.correct)).toBe(
      true,
    )
  })

  it('grades a partially correct submission', async () => {
    const res = await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-42'])
      .send({ responses: { '1': 'ka', '2': 'kha' } })
    expect(res.body.data.score).toBe(1)
    expect(res.body.data.results.map((r: { correct: boolean }) => r.correct)).toEqual(
      [true, false],
    )
  })

  it('reveals the key and explanation only after submitting', async () => {
    const res = await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-42'])
      .send({ responses: { '1': 'ka', '2': 'ga' } })
    expect(res.body.data.results[0].correctKeys).toEqual(['ka'])
    expect(res.body.data.results[0].explanation).toContain('প্ল্যাঙ্ক')
  })

  it('persists per-question answers, not just a total', async () => {
    await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-42'])
      .send({ responses: { '1': 'ka', '2': 'kha' } })
    expect(stub.quizAttemptAnswer.createMany).toHaveBeenCalledOnce()
    const rows = stub.quizAttemptAnswer.createMany.mock.calls[0][0].data
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ questionId: 1, isCorrect: true })
    expect(rows[1]).toMatchObject({ questionId: 2, isCorrect: false })
  })

  it('refuses to submit into another student’s attempt', async () => {
    // Attempt 77 belongs to student 42.
    const res = await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-99'])
      .send({ responses: { '1': 'ka' } })
    expect(res.status).toBe(403)
    expect(stub.$transaction).not.toHaveBeenCalled()
  })

  it('refuses to submit twice', async () => {
    stub.quizAttempt.findUnique.mockResolvedValue({
      id: 77,
      studentUserId: 42,
      status: 'SUBMITTED',
      quiz,
    })
    const res = await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-42'])
      .send({ responses: { '1': 'ka' } })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('ALREADY_SUBMITTED')
  })

  it('rejects a malformed body', async () => {
    const res = await request(app())
      .post(url)
      .set('Cookie', ['ilsp_session=tok-42'])
      .send({ responses: 'not an object' })
    expect(res.status).toBe(400)
  })

  it('requires authentication', async () => {
    const res = await request(app()).post(url).send({ responses: {} })
    expect(res.status).toBe(401)
  })
})
