/**
 * Fixed-window rate limiting, in process memory.
 *
 * Enough to make online guessing and bulk account creation impractical on a
 * single-process deployment. It resets on restart and is per-process, so a
 * multi-instance deployment must move this to Redis or the database — that is
 * a known limitation, recorded in the README rather than pretended away.
 */

export interface RateLimitOptions {
  max: number
  windowMs: number
}

interface Entry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private readonly entries = new Map<string, Entry>()
  private readonly max: number
  private readonly windowMs: number

  constructor({ max, windowMs }: RateLimitOptions) {
    this.max = max
    this.windowMs = windowMs
  }

  isBlocked(key: string): boolean {
    const entry = this.entries.get(key)
    if (!entry || entry.resetAt < Date.now()) return false
    return entry.count >= this.max
  }

  recordFailure(key: string): void {
    const now = Date.now()
    const entry = this.entries.get(key)
    if (!entry || entry.resetAt < now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs })
    } else {
      entry.count += 1
    }
    this.sweep(now)
  }

  clear(key: string): void {
    this.entries.delete(key)
  }

  /** Opportunistic cleanup; this map must not grow without bound. */
  private sweep(now: number): void {
    if (this.entries.size <= 5000) return
    for (const [key, entry] of this.entries) {
      if (entry.resetAt < now) this.entries.delete(key)
    }
  }

  /** Test seam. */
  reset(): void {
    this.entries.clear()
  }
}
