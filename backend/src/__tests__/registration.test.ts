import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../app'
import { SESSION_COOKIE } from '../lib/session'

/**
 * Separate registration and login flows for students and teachers.
 *
 * The assertions that matter most are the ones proving the role is decided by
 * the endpoint and never by the request body.
 */

const sha = (t: string) => createHash('sha256').update(t).digest('hex')

const ROLES: Record<string, { id: number; code: string }> = {
  STUDENT: { id: 1, code: 'STUDENT' },
  TEACHER: { id: 2, code: 'TEACHER' },
  ADMIN: { id: 3, code: 'ADMIN' },
}

function sessionFor(userId: number, roleCode: string) {
  return {
    id: userId,
    userId,
    expiresAt: new Date(Date.now() + 3_600_000),
    lastSeenAt: new Date(),
    user: {
      status: 'ACTIVE',
      name: roleCode === 'TEACHER' ? 'Test Teacher' : 'Test Student',
      preferredLanguage: 'BN',
      role: { code: roleCode },
      student: roleCode === 'STUDENT' ? { userId } : null,
    },
  }
}

const TOKENS: Record<string, { userId: number; role: string }> = {
  [sha('tok-student')]: { userId: 42, role: 'STUDENT' },
  [sha('tok-teacher')]: { userId: 77, role: 'TEACHER' },
}

function createStub() {
  const created: Record<string, unknown>[] = []
  return {
    created,
    role: {
      findUnique: vi.fn(({ where }: { where: { code: string } }) =>
        Promise.resolve(ROLES[where.code] ?? null),
      ),
    },
    class: {
      findFirst: vi.fn(({ where }: { where: { level: number } }) =>
        Promise.resolve(
          [6, 7, 8, 9, 10].includes(where.level)
            ? { id: 100 + where.level }
            : null,
        ),
      ),
      findMany: vi.fn().mockResolvedValue([
        { id: 106, level: 6, nameBn: 'ষষ্ঠ শ্রেণি', nameEn: 'Class 6' },
        { id: 110, level: 10, nameBn: 'দশম শ্রেণি', nameEn: 'Class 10' },
      ]),
    },
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    student: { create: vi.fn(), groupBy: vi.fn().mockResolvedValue([]) },
    teacher: {
      create: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({
        employeeCode: 'T-000077',
        institution: 'Dhaka Collegiate School',
      }),
    },
    teacherAssignment: { findMany: vi.fn().mockResolvedValue([]) },
    session: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      findUnique: vi.fn(({ where }: { where: { tokenHash: string } }) => {
        const entry = TOKENS[where.tokenHash]
        return Promise.resolve(entry ? sessionFor(entry.userId, entry.role) : null)
      }),
      delete: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
            created.push(data)
            return Promise.resolve({
              id: 500,
              name: data.name,
              preferredLanguage: 'BN',
            })
          }),
        },
        student: { create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data) }) },
        teacher: { create: vi.fn(({ data }) => { created.push(data); return Promise.resolve(data) }) },
      }
      return fn(tx)
    }),
  }
}

let stub: ReturnType<typeof createStub>
const app = () => createApp({ prisma: stub as unknown as PrismaClient })

// Registration is rate limited per IP+email; unique emails keep tests isolated.
let n = 0
const uniqueEmail = () => `person${Date.now()}${n++}@example.local`

beforeEach(() => {
  stub = createStub()
})

describe('GET /api/auth/enrollable-classes', () => {
  it('lists the classes a student may register for', async () => {
    const res = await request(app()).get('/api/auth/enrollable-classes')
    expect(res.status).toBe(200)
    expect(res.body.data.map((c: { level: number }) => c.level)).toEqual([6, 10])
  })

  it('queries only levels 6 to 10, published', async () => {
    await request(app()).get('/api/auth/enrollable-classes')
    const where = stub.class.findMany.mock.calls[0][0].where
    expect(where.level.in).toEqual([6, 7, 8, 9, 10])
    expect(where.status).toBe('PUBLISHED')
  })
})

describe('POST /api/auth/register/student', () => {
  const valid = () => ({
    name: 'Limon Reza',
    email: uniqueEmail(),
    password: 'ChangeMe!123',
    classLevel: 9,
  })

  it('creates a student account and signs them in', async () => {
    const res = await request(app()).post('/api/auth/register/student').send(valid())
    expect(res.status).toBe(201)
    expect(res.body.data.roleCode).toBe('STUDENT')
    expect(res.body.data.isStudent).toBe(true)
    expect(res.body.data.classLevel).toBe(9)
    expect(res.headers['set-cookie'][0]).toContain(`${SESSION_COOKIE}=`)
  })

  it('stores the chosen class against the student', async () => {
    await request(app()).post('/api/auth/register/student').send({ ...valid(), classLevel: 7 })
    const studentRow = stub.created.find((row) => 'classId' in row)
    expect(studentRow).toBeDefined()
    expect(studentRow!.classId).toBe(107) // stub maps level -> 100 + level
    expect(studentRow!.studentCode).toBe('S-000500')
  })

  it('accepts every enrollable class, 6 through 10', async () => {
    for (const classLevel of [6, 7, 8, 9, 10]) {
      stub = createStub()
      const res = await request(app())
        .post('/api/auth/register/student')
        .send({ ...valid(), classLevel })
      expect(res.status, `class ${classLevel}`).toBe(201)
    }
  })

  it('REJECTS a missing class', async () => {
    const { classLevel: _omitted, ...withoutClass } = valid()
    const res = await request(app()).post('/api/auth/register/student').send(withoutClass)
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/class/i)
    expect(stub.$transaction).not.toHaveBeenCalled()
  })

  it('REJECTS a class outside 6–10', async () => {
    for (const classLevel of [5, 11, 0, -3, 99]) {
      stub = createStub()
      const res = await request(app())
        .post('/api/auth/register/student')
        .send({ ...valid(), classLevel })
      expect(res.status, `class ${classLevel}`).toBe(400)
      expect(stub.$transaction).not.toHaveBeenCalled()
    }
  })

  it('REJECTS a non-numeric class', async () => {
    const res = await request(app())
      .post('/api/auth/register/student')
      .send({ ...valid(), classLevel: 'nine' })
    expect(res.status).toBe(400)
  })

  it('rejects a class that is not published, even if the number is in range', async () => {
    stub.class.findFirst.mockResolvedValue(null)
    const res = await request(app()).post('/api/auth/register/student').send(valid())
    expect(res.status).toBe(400)
    expect(stub.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a short password and a malformed email', async () => {
    const short = await request(app())
      .post('/api/auth/register/student')
      .send({ ...valid(), password: 'short' })
    expect(short.status).toBe(400)

    const bad = await request(app())
      .post('/api/auth/register/student')
      .send({ ...valid(), email: 'not-an-email' })
    expect(bad.status).toBe(400)
  })

  it('never stores the password in plaintext', async () => {
    await request(app()).post('/api/auth/register/student').send(valid())
    const userRow = stub.created.find((row) => 'passwordHash' in row)
    expect(userRow!.passwordHash).not.toBe('ChangeMe!123')
    expect(String(userRow!.passwordHash)).toMatch(/^scrypt\$/)
  })

  it('IGNORES a client-supplied role and always creates a STUDENT', async () => {
    // The whole point of separate endpoints. Privilege escalation attempt:
    const res = await request(app())
      .post('/api/auth/register/student')
      .send({ ...valid(), role: 'ADMIN', roleCode: 'TEACHER', roleId: 3 })

    expect(res.status).toBe(201)
    expect(res.body.data.roleCode).toBe('STUDENT')
    // The role id written is the STUDENT role, not anything from the body.
    const userRow = stub.created.find((row) => 'roleId' in row)
    expect(userRow!.roleId).toBe(ROLES.STUDENT.id)
    expect(stub.role.findUnique).toHaveBeenCalledWith({ where: { code: 'STUDENT' } })
  })
})

describe('POST /api/auth/register/teacher', () => {
  const valid = () => ({
    name: 'Rashid Sir',
    email: uniqueEmail(),
    password: 'ChangeMe!123',
  })

  it('creates a teacher account and signs them in', async () => {
    const res = await request(app()).post('/api/auth/register/teacher').send(valid())
    expect(res.status).toBe(201)
    expect(res.body.data.roleCode).toBe('TEACHER')
    expect(res.body.data.isStudent).toBe(false)
    expect(res.headers['set-cookie'][0]).toContain(`${SESSION_COOKIE}=`)
  })

  it('does not require a class', async () => {
    const res = await request(app()).post('/api/auth/register/teacher').send(valid())
    expect(res.status).toBe(201)
    expect(stub.class.findFirst).not.toHaveBeenCalled()
  })

  it('stores an optional institution and generates an employee code', async () => {
    await request(app())
      .post('/api/auth/register/teacher')
      .send({ ...valid(), institution: 'Dhaka Collegiate School' })
    const teacherRow = stub.created.find((row) => 'employeeCode' in row)
    expect(teacherRow!.institution).toBe('Dhaka Collegiate School')
    expect(teacherRow!.employeeCode).toBe('T-000500')
  })

  it('IGNORES a client-supplied role and always creates a TEACHER', async () => {
    const res = await request(app())
      .post('/api/auth/register/teacher')
      .send({ ...valid(), role: 'ADMIN' })
    expect(res.body.data.roleCode).toBe('TEACHER')
    expect(stub.role.findUnique).toHaveBeenCalledWith({ where: { code: 'TEACHER' } })
  })
})

describe('role-based route protection', () => {
  const asStudent = (r: request.Test) => r.set('Cookie', [`${SESSION_COOKIE}=tok-student`])
  const asTeacher = (r: request.Test) => r.set('Cookie', [`${SESSION_COOKIE}=tok-teacher`])

  it('lets a teacher read the teacher overview', async () => {
    const res = await asTeacher(request(app()).get('/api/teacher/overview'))
    expect(res.status).toBe(200)
    expect(res.body.data.employeeCode).toBe('T-000077')
  })

  it('BLOCKS a student from the teacher overview', async () => {
    const res = await asStudent(request(app()).get('/api/teacher/overview'))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('blocks an anonymous caller from the teacher overview', async () => {
    const res = await request(app()).get('/api/teacher/overview')
    expect(res.status).toBe(401)
  })

  it('shows a teacher no students until an assignment exists', async () => {
    // Scope comes from TeacherAssignment. Absent one, the honest answer is
    // "none" — never "all students".
    const res = await asTeacher(request(app()).get('/api/teacher/overview'))
    expect(res.body.data.assignments).toEqual([])
    expect(res.body.data.totalStudents).toBe(0)
    expect(stub.student.groupBy).not.toHaveBeenCalled()
  })

  it('BLOCKS a teacher from student-only progress routes', async () => {
    // A teacher has no Student row, so learner-data writes must refuse rather
    // than attribute the row to nobody.
    const res = await asTeacher(request(app()).get('/api/chapters/1/progress'))
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('NOT_A_STUDENT')
  })
})
