import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../app'
import { SESSION_COOKIE } from '../lib/session'

/**
 * Teacher scoping and assignment administration.
 *
 * The assertions that matter are the negative ones: a teacher must not be able
 * to read a class they were never assigned, and must not be able to assign
 * themselves one.
 */

const sha = (t: string) => createHash('sha256').update(t).digest('hex')

const SESSIONS: Record<string, { userId: number; role: string }> = {
  [sha('tok-teacher')]: { userId: 77, role: 'TEACHER' },
  [sha('tok-other-teacher')]: { userId: 88, role: 'TEACHER' },
  [sha('tok-student')]: { userId: 42, role: 'STUDENT' },
  [sha('tok-admin')]: { userId: 1, role: 'ADMIN' },
}

function sessionFor(userId: number, roleCode: string) {
  return {
    id: userId,
    userId,
    expiresAt: new Date(Date.now() + 3_600_000),
    lastSeenAt: new Date(),
    user: {
      status: 'ACTIVE',
      name: `User ${userId}`,
      preferredLanguage: 'BN',
      role: { code: roleCode },
      student: roleCode === 'STUDENT' ? { userId } : null,
    },
  }
}

/** Teacher 77 is assigned to class 9 (Physics). Teacher 88 has nothing. */
const ASSIGNMENT = {
  id: 5,
  teacherUserId: 77,
  classId: 9,
  subjectId: 1,
  assignedAt: new Date('2026-08-15'),
  class: { id: 9, level: 9, nameBn: 'নবম শ্রেণি', nameEn: 'Class 9' },
  subject: { id: 1, nameBn: 'পদার্থবিজ্ঞান', nameEn: 'Physics' },
  teacher: { user: { name: 'Rashid Sir', email: 'rashid@example.local' } },
}

function createStub() {
  return {
    session: {
      findUnique: vi.fn(({ where }: { where: { tokenHash: string } }) => {
        const s = SESSIONS[where.tokenHash]
        return Promise.resolve(s ? sessionFor(s.userId, s.role) : null)
      }),
      delete: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    teacherAssignment: {
      // Only teacher 77 / class 9 resolves.
      findFirst: vi.fn(({ where }: { where: { teacherUserId: number; classId: number } }) =>
        Promise.resolve(
          where.teacherUserId === 77 && where.classId === 9 ? ASSIGNMENT : null,
        ),
      ),
      findMany: vi.fn().mockResolvedValue([ASSIGNMENT]),
      findUnique: vi.fn().mockResolvedValue(ASSIGNMENT),
      create: vi.fn().mockResolvedValue({ id: 9, assignedAt: new Date() }),
      delete: vi.fn().mockResolvedValue({}),
    },
    teacher: {
      findUnique: vi.fn(({ where }: { where: { userId: number } }) =>
        Promise.resolve(
          [77, 88].includes(where.userId)
            ? { userId: where.userId, employeeCode: 'T-000077', institution: null }
            : null,
        ),
      ),
      findMany: vi.fn().mockResolvedValue([]),
    },
    student: {
      findMany: vi.fn().mockResolvedValue([
        { userId: 42, studentCode: 'S-000042', user: { name: 'Limon' } },
        { userId: 43, studentCode: 'S-000043', user: { name: 'Nadia' } },
      ]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    class: {
      findFirst: vi.fn(({ where }: { where: { id: number } }) =>
        Promise.resolve(where.id === 9 ? { id: 9 } : null),
      ),
      findMany: vi.fn().mockResolvedValue([]),
    },
    subject: { findMany: vi.fn().mockResolvedValue([]) },
    classSubject: { findUnique: vi.fn().mockResolvedValue({ classId: 9, subjectId: 1 }) },
    lesson: { count: vi.fn().mockResolvedValue(5) },
    lessonProgress: {
      groupBy: vi.fn(({ _count }: { _count?: unknown }) =>
        Promise.resolve(
          _count
            ? [{ studentUserId: 42, _count: { lessonId: 3 } }]
            : [{ studentUserId: 42, _max: { lastActivityAt: new Date('2026-08-14') } }],
        ),
      ),
    },
    quizAttempt: {
      findMany: vi.fn().mockResolvedValue([
        { studentUserId: 42, score: 4, maxScore: 5 },
        { studentUserId: 42, score: 5, maxScore: 5 },
      ]),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  }
}

let stub: ReturnType<typeof createStub>
const app = () => createApp({ prisma: stub as unknown as PrismaClient })
const as = (token: string) => (r: request.Test) =>
  r.set('Cookie', [`${SESSION_COOKIE}=${token}`])

beforeEach(() => {
  stub = createStub()
})

describe('GET /api/teacher/classes/:id/students', () => {
  it('returns the roster for an assigned class', async () => {
    const res = await as('tok-teacher')(
      request(app()).get('/api/teacher/classes/9/students'),
    )
    expect(res.status).toBe(200)
    expect(res.body.data.classLevel).toBe(9)
    expect(res.body.data.students).toHaveLength(2)
    expect(res.body.data.totalLessons).toBe(5)
  })

  it('computes each student’s completion and average score', async () => {
    const res = await as('tok-teacher')(
      request(app()).get('/api/teacher/classes/9/students'),
    )
    const limon = res.body.data.students.find(
      (s: { studentUserId: number }) => s.studentUserId === 42,
    )
    expect(limon.completedLessons).toBe(3)
    expect(limon.completionPercent).toBe(60) // 3 of 5
    // 4/5 and 5/5 normalise to 80% and 100%.
    expect(limon.scoreAvg).toBe(90)
    expect(limon.attempts).toBe(2)
  })

  it('reports a student with no activity as zero, and scoreAvg null', async () => {
    const res = await as('tok-teacher')(
      request(app()).get('/api/teacher/classes/9/students'),
    )
    const nadia = res.body.data.students.find(
      (s: { studentUserId: number }) => s.studentUserId === 43,
    )
    expect(nadia.completedLessons).toBe(0)
    expect(nadia.completionPercent).toBe(0)
    // Not 0: she has attempted nothing, which is a different fact from failing.
    expect(nadia.scoreAvg).toBeNull()
  })

  it('BLOCKS a teacher from a class they are not assigned', async () => {
    const res = await as('tok-teacher')(
      request(app()).get('/api/teacher/classes/10/students'),
    )
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('NOT_ASSIGNED')
    // The refusal happens before any student is read.
    expect(stub.student.findMany).not.toHaveBeenCalled()
  })

  it('BLOCKS a teacher with no assignments at all', async () => {
    const res = await as('tok-other-teacher')(
      request(app()).get('/api/teacher/classes/9/students'),
    )
    expect(res.status).toBe(403)
    expect(stub.student.findMany).not.toHaveBeenCalled()
  })

  it('BLOCKS a student from reading any roster', async () => {
    const res = await as('tok-student')(
      request(app()).get('/api/teacher/classes/9/students'),
    )
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('blocks an anonymous caller', async () => {
    const res = await request(app()).get('/api/teacher/classes/9/students')
    expect(res.status).toBe(401)
  })
})

describe('assignment administration', () => {
  it('lets an admin create an assignment', async () => {
    const res = await as('tok-admin')(
      request(app()).post('/api/admin/assignments'),
    ).send({ teacherUserId: 88, classId: 9, subjectId: 1 })

    expect(res.status).toBe(201)
    expect(stub.teacherAssignment.create).toHaveBeenCalledOnce()
    expect(stub.teacherAssignment.create.mock.calls[0][0].data).toMatchObject({
      teacherUserId: 88,
      classId: 9,
      subjectId: 1,
    })
  })

  it('records an audit entry, because this grants access to children', async () => {
    await as('tok-admin')(request(app()).post('/api/admin/assignments')).send({
      teacherUserId: 88,
      classId: 9,
    })
    expect(stub.auditLog.create).toHaveBeenCalledOnce()
    expect(stub.auditLog.create.mock.calls[0][0].data).toMatchObject({
      action: 'TEACHER_ASSIGNMENT_CREATED',
      userId: 1,
    })
  })

  it('BLOCKS a teacher from assigning themselves a class', async () => {
    // The whole scoping model rests on this being impossible.
    const res = await as('tok-teacher')(
      request(app()).post('/api/admin/assignments'),
    ).send({ teacherUserId: 77, classId: 10 })

    expect(res.status).toBe(403)
    expect(stub.teacherAssignment.create).not.toHaveBeenCalled()
  })

  it('BLOCKS a student from assigning anything', async () => {
    const res = await as('tok-student')(
      request(app()).post('/api/admin/assignments'),
    ).send({ teacherUserId: 77, classId: 9 })
    expect(res.status).toBe(403)
    expect(stub.teacherAssignment.create).not.toHaveBeenCalled()
  })

  it('rejects an unknown teacher or class with 400, not a constraint error', async () => {
    const badTeacher = await as('tok-admin')(
      request(app()).post('/api/admin/assignments'),
    ).send({ teacherUserId: 999, classId: 9 })
    expect(badTeacher.status).toBe(400)

    const badClass = await as('tok-admin')(
      request(app()).post('/api/admin/assignments'),
    ).send({ teacherUserId: 77, classId: 999 })
    expect(badClass.status).toBe(400)
  })

  it('rejects a subject the class does not study', async () => {
    // Otherwise the assignment produces a scope matching no lessons at all.
    stub.classSubject.findUnique.mockResolvedValue(null)
    const res = await as('tok-admin')(
      request(app()).post('/api/admin/assignments'),
    ).send({ teacherUserId: 77, classId: 9, subjectId: 4 })
    expect(res.status).toBe(400)
    expect(stub.teacherAssignment.create).not.toHaveBeenCalled()
  })

  it('lets an admin remove an assignment and records it', async () => {
    const res = await as('tok-admin')(
      request(app()).delete('/api/admin/assignments/5'),
    )
    expect(res.status).toBe(200)
    expect(stub.teacherAssignment.delete).toHaveBeenCalledOnce()
    expect(stub.auditLog.create.mock.calls[0][0].data.action).toBe(
      'TEACHER_ASSIGNMENT_REMOVED',
    )
  })

  it('BLOCKS a teacher from removing an assignment', async () => {
    const res = await as('tok-teacher')(
      request(app()).delete('/api/admin/assignments/5'),
    )
    expect(res.status).toBe(403)
    expect(stub.teacherAssignment.delete).not.toHaveBeenCalled()
  })
})
