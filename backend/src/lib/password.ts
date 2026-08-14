import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'
import { promisify } from 'node:util'

// promisify picks scrypt's 3-argument overload and drops the one that accepts
// tuning options, so the signature is restated here.
const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>

/**
 * Password hashing with scrypt from node's standard library.
 *
 * scrypt rather than bcrypt/argon2 because it is built in: no native module to
 * compile, which matters on a Windows development machine and removes a
 * dependency from the supply chain of a platform used by children.
 *
 * Format: scrypt$N$r$p$salt$key — parameters travel with the hash, so they can
 * be raised later without invalidating existing passwords.
 */

const KEY_LENGTH = 64
const SALT_BYTES = 16

/** ~100 ms per hash on typical hardware. Raise N as machines get faster. */
const DEFAULT_PARAMS = { N: 16384, r: 8, p: 1 }

/**
 * Unicode-normalise before hashing.
 *
 * Bangla text has multiple valid encodings of the same visible string, so a
 * password typed on one keyboard could otherwise fail to match the same
 * password typed on another. This is not a nicety on a Bangla-first platform.
 */
function normalise(plain: string): string {
  return plain.normalize('NFKC')
}

export async function hashPassword(plain: string): Promise<string> {
  const { N, r, p } = DEFAULT_PARAMS
  const salt = randomBytes(SALT_BYTES)
  const key = await scryptAsync(normalise(plain), salt, KEY_LENGTH, {
    N,
    r,
    p,
    // scrypt needs memory ~128 * N * r bytes; the default cap is too low for N=16384.
    maxmem: 128 * N * r * 2,
  })

  return [
    'scrypt',
    N,
    r,
    p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$')
}

/**
 * Verifies a password against a stored hash.
 *
 * Returns false rather than throwing on a malformed or legacy hash — the seed
 * once wrote placeholder strings, and a login route must treat those as "wrong
 * password", not as a 500 that reveals the account exists.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false

    const N = Number(parts[1])
    const r = Number(parts[2])
    const p = Number(parts[3])
    if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
      return false
    }

    const salt = Buffer.from(parts[4], 'base64')
    const expected = Buffer.from(parts[5], 'base64')
    if (salt.length === 0 || expected.length === 0) return false

    const actual = await scryptAsync(normalise(plain), salt, expected.length, {
      N,
      r,
      p,
      maxmem: 128 * N * r * 2,
    })

    // Constant-time: a length-dependent or short-circuiting compare leaks how
    // much of the hash matched.
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

/**
 * Burns roughly the same time as a real verification.
 *
 * Called when the email does not exist, so that "no such user" and "wrong
 * password" take comparable time. Without it, response latency alone tells an
 * attacker which email addresses are registered.
 */
export async function dummyVerify(): Promise<void> {
  const { N, r, p } = DEFAULT_PARAMS
  await scryptAsync('dummy-password', randomBytes(SALT_BYTES), KEY_LENGTH, {
    N,
    r,
    p,
    maxmem: 128 * N * r * 2,
  })
}
