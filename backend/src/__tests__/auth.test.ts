import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { createApp } from '../app'
import { hashPassword, verifyPassword, dummyVerify } from '../lib/password'
import { generateToken, hashToken, SESSION_COOKIE } from '../lib/session'

describe('password hashing', () => {
  it('produces a self-describing hash, never the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(hash).not.toContain('correct horse')
    expect(hash.split('$')).toHaveLength(6)
  })

  it('salts: the same password hashes differently every time', async () => {
    const a = await hashPassword('same-password')
    const b = await hashPassword('same-password')
    expect(a).not.toBe(b)
    // …but both still verify.
    expect(await verifyPassword('same-password', a)).toBe(true)
    expect(await verifyPassword('same-password', b)).toBe(true)
  })

  it('accepts the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('ChangeMe!123')
    expect(await verifyPassword('ChangeMe!123', hash)).toBe(true)
    expect(await verifyPassword('ChangeMe!124', hash)).toBe(false)
    expect(await verifyPassword('', hash)).toBe(false)
  })

  it('matches a Bangla password across Unicode normalisation forms', async () => {
    // Composed vs decomposed forms look identical but differ byte-for-byte;
    // without NFKC the same typed password could fail on another keyboard.
    const composed = 'পাসওয়ার্ড১২৩'
    const hash = await hashPassword(composed)
    expect(await verifyPassword(composed.normalize('NFD'), hash)).toBe(true)
    expect(await verifyPassword(composed.normalize('NFC'), hash)).toBe(true)
  })

  it('returns false, not an exception, for a malformed stored hash', async () => {
    // The seed used to write placeholder strings. A login route must treat
    // those as a wrong password, not a 500 that confirms the account exists.
    expect(await verifyPassword('anything', 'CHANGE_ME_dev_only')).toBe(false)
    expect(await verifyPassword('anything', '')).toBe(false)
    expect(await verifyPassword('anything', 'scrypt$bad')).toBe(false)
    expect(await verifyPassword('anything', 'scrypt$x$y$z$aa$bb')).toBe(false)
  })

  it('dummyVerify resolves, so unknown emails cost similar time', async () => {
    await expect(dummyVerify()).resolves.toBeUndefined()
  })
})

describe('session tokens', () => {
  it('are high entropy and never stored raw', () => {
    const token = generateToken()
    expect(token.length).toBeGreaterThanOrEqual(43) // 32 bytes base64url
    const stored = hashToken(token)
    expect(stored).toHaveLength(64) // sha256 hex
    expect(stored).not.toContain(token)
  })

  it('hash deterministically, so lookup works', () => {
    const token = generateToken()
    expect(hashToken(token)).toBe(hashToken(token))
    expect(hashToken(token)).not.toBe(hashToken(generateToken()))
  })
})

// ---------------------------------------------------------------------------

const PASSWORD = 'ChangeMe!123'
let passwordHash: string
const sha = (t: string) => createHash('sha256').update(t).digest('hex')

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    name: 'ডেমো শিক্ষার্থী',
    email: 'student@example.local',
    passwordHash,
    status: 'ACTIVE',
    preferredLanguage: 'BN',
    role: { code: 'STUDENT' },
    student: { userId: 42 },
    ...overrides,
  }
}

function createStub() {
  return {
    user: { findUnique: vi.fn().mockResolvedValue(user()) },
    session: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      findUnique: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  }
}

let stub: ReturnType<typeof createStub>
const app = () => createApp({ prisma: stub as unknown as PrismaClient })

beforeEach(async () => {
  passwordHash ??= await hashPassword(PASSWORD)
  stub = createStub()
})

describe('POST /api/auth/login', () => {
  it('sets an httpOnly session cookie on success', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.data.roleCode).toBe('STUDENT')

    const cookie = res.headers['set-cookie'][0]
    expect(cookie).toContain(`${SESSION_COOKIE}=`)
    // JavaScript must not be able to read the token, and the cookie must not
    // ride along on cross-site requests.
    expect(cookie).toContain('HttpOnly')
    expect(cookie.toLowerCase()).toContain('samesite=lax')
  })

  it('never returns the password hash', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: PASSWORD })
    const body = JSON.stringify(res.body)
    expect(body).not.toContain('scrypt')
    expect(body).not.toContain('passwordHash')
  })

  it('stores only the hash of the token, never the token itself', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: PASSWORD })

    const cookie = res.headers['set-cookie'][0]
    const token = /ilsp_session=([^;]+)/.exec(cookie)![1]
    const stored = stub.session.create.mock.calls[0][0].data.tokenHash

    expect(stored).toBe(sha(token))
    expect(stored).not.toBe(token)
  })

  it('remember me extends the session, and is off by default', async () => {
    const plain = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: PASSWORD })
    const plainExpiry = stub.session.create.mock.calls[0][0].data.expiresAt as Date

    stub = createStub()
    const remembered = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: PASSWORD, rememberMe: true })
    const longExpiry = stub.session.create.mock.calls[0][0].data.expiresAt as Date

    expect(plain.status).toBe(200)
    expect(remembered.status).toBe(200)
    // Default is the short lifetime; opting in is meaningfully longer but still
    // bounded — a session that never expires cannot be revoked by time.
    expect(longExpiry.getTime()).toBeGreaterThan(plainExpiry.getTime())
    const days = (longExpiry.getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(25)
    expect(days).toBeLessThan(35)
  })

  it('rejects a wrong password', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: 'wrong' })
    expect(res.status).toBe(401)
    expect(stub.session.create).not.toHaveBeenCalled()
  })

  it('gives an unknown email the same answer as a wrong password', async () => {
    // User enumeration: differing status or message would confirm which
    // addresses are registered.
    stub.user.findUnique.mockResolvedValue(null)
    const unknown = await request(app())
      .post('/api/auth/login')
      .send({ email: 'nobody@example.local', password: 'whatever' })

    expect(unknown.status).toBe(401)
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS')
    expect(unknown.body.error.message).toBe('Incorrect email or password')
  })

  it('refuses a suspended account even with the right password', async () => {
    stub.user.findUnique.mockResolvedValue(user({ status: 'SUSPENDED' }))
    const res = await request(app())
      .post('/api/auth/login')
      .send({ email: 'student@example.local', password: PASSWORD })
    expect(res.status).toBe(403)
    expect(stub.session.create).not.toHaveBeenCalled()
  })

  it('validates the payload', async () => {
    const res = await request(app())
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'x' })
    expect(res.status).toBe(400)
  })

  it('rate limits repeated failures', async () => {
    stub.user.findUnique.mockResolvedValue(null)
    let last = 0
    for (let i = 0; i < 10; i++) {
      const res = await request(app())
        .post('/api/auth/login')
        .send({ email: 'bruteforce@example.local', password: `guess${i}` })
      last = res.status
    }
    expect(last).toBe(429)
  })
})

describe('GET /api/auth/me', () => {
  it('401s without a session', async () => {
    const res = await request(app()).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns the caller when the cookie resolves', async () => {
    stub.session.findUnique.mockResolvedValue({
      id: 1,
      userId: 42,
      expiresAt: new Date(Date.now() + 3_600_000),
      lastSeenAt: new Date(),
      user: user(),
    })
    const res = await request(app())
      .get('/api/auth/me')
      .set('Cookie', [`${SESSION_COOKIE}=anything`])
    expect(res.status).toBe(200)
    expect(res.body.data.userId).toBe(42)
    expect(res.body.data.isStudent).toBe(true)
  })

  it('rejects an expired session and deletes it', async () => {
    stub.session.findUnique.mockResolvedValue({
      id: 1,
      userId: 42,
      expiresAt: new Date(Date.now() - 1000), // already expired
      lastSeenAt: new Date(),
      user: user(),
    })
    const res = await request(app())
      .get('/api/auth/me')
      .set('Cookie', [`${SESSION_COOKIE}=stale`])
    expect(res.status).toBe(401)
    expect(stub.session.delete).toHaveBeenCalled()
  })

  it('kills every session of an account that stops being ACTIVE', async () => {
    // A ban must take effect immediately, not when the session expires.
    stub.session.findUnique.mockResolvedValue({
      id: 1,
      userId: 42,
      expiresAt: new Date(Date.now() + 3_600_000),
      lastSeenAt: new Date(),
      user: user({ status: 'DISABLED' }),
    })
    const res = await request(app())
      .get('/api/auth/me')
      .set('Cookie', [`${SESSION_COOKIE}=valid-but-banned`])
    expect(res.status).toBe(401)
    expect(stub.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 42 } })
  })

  it('ignores a garbage cookie rather than erroring', async () => {
    const res = await request(app())
      .get('/api/auth/me')
      .set('Cookie', [`${SESSION_COOKIE}=not-a-real-token`])
    expect(res.status).toBe(401)
  })
})

describe('logout', () => {
  it('revokes the session and clears the cookie', async () => {
    const res = await request(app())
      .post('/api/auth/logout')
      .set('Cookie', [`${SESSION_COOKIE}=tok`])
    expect(res.status).toBe(200)
    expect(stub.session.deleteMany).toHaveBeenCalled()
    expect(res.headers['set-cookie'][0]).toContain(`${SESSION_COOKIE}=;`)
  })

  it('succeeds even without a session, so logout is idempotent', async () => {
    const res = await request(app()).post('/api/auth/logout')
    expect(res.status).toBe(200)
  })

  it('logout-all requires a session and revokes every one', async () => {
    const anon = await request(app()).post('/api/auth/logout-all')
    expect(anon.status).toBe(401)

    stub.session.findUnique.mockResolvedValue({
      id: 1,
      userId: 42,
      expiresAt: new Date(Date.now() + 3_600_000),
      lastSeenAt: new Date(),
      user: user(),
    })
    const res = await request(app())
      .post('/api/auth/logout-all')
      .set('Cookie', [`${SESSION_COOKIE}=tok`])
    expect(res.status).toBe(200)
    expect(res.body.data.revoked).toBe(3)
  })
})
