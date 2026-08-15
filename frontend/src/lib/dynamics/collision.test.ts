import { describe, it, expect } from 'vitest'
import { elasticCollision, inelasticCollision } from './collision'

/**
 * Expected values come from the book's own worked example (§৩.৫.২, p. 74):
 * a truck of mass m1 and a small car of mass m2 approach head-on at the same
 * speed u (u1 = u, u2 = -u). Taking m2 -> 0 as "much lighter than the truck",
 * the book finds:
 *   v1' = u        (the truck barely slows)
 *   v2' = 3u        (the car rebounds at three times the closing speed)
 * That is the exact fixture below, not a rounded approximation of it.
 */

describe('elasticCollision — the book’s truck-and-car example, p. 74', () => {
  it('a very light car against a heavy truck: truck keeps its speed, car flung to 3u', () => {
    const u = 10 // m/s, arbitrary — the book keeps it symbolic
    const m1 = 5000 // truck, kg
    const m2 = 0.001 // car mass driven toward zero, as the book does symbolically

    const result = elasticCollision(m1, u, m2, -u)

    expect(result.body1.velocity).toBeCloseTo(u, 2)
    expect(result.body2.velocity).toBeCloseTo(3 * u, 1)
  })

  it('the car’s velocity change is 4u, exactly as the book states', () => {
    // "ছোট গাড়িটির বেগ -u থেকে পরিবর্তিত হয়ে 3u হবে... বেগের পরিবর্তন
    //  3u - (-u) = 4u" (p. 75)
    const u = 10
    const result = elasticCollision(5000, u, 0.001, -u)
    const change = result.body2.velocity - -u
    expect(change).toBeCloseTo(4 * u, 1)
  })
})

describe('elasticCollision — general conservation properties', () => {
  it('conserves momentum for any two masses', () => {
    const result = elasticCollision(3, 4, 5, -2)
    expect(result.momentumAfter).toBeCloseTo(result.momentumBefore, 6)
  })

  it('conserves momentum at book-realistic masses, not just small integers', () => {
    // Regression: momentumAfter was once computed from velocities already
    // rounded to 6 decimals, so multiplying by a 5000 kg mass amplified that
    // rounding into a ~2.5e-3 error — enough that a naive UI comparison with a
    // 1e-6 absolute tolerance reported "not conserved" for the exact seeded
    // defaults (mass1=5000, mass2=50, speed=10). Caught by driving the
    // renderer in a browser with real numbers, not by this suite's smaller
    // fixtures — this case exists so it cannot happen silently again.
    const result = elasticCollision(5000, 10, 50, -10)
    expect(result.momentumAfter).toBeCloseTo(result.momentumBefore, 6)
    expect(Math.abs(result.momentumAfter - result.momentumBefore)).toBeLessThan(1e-6)
  })

  it('conserves kinetic energy — the defining property of an elastic collision', () => {
    const result = elasticCollision(3, 4, 5, -2)
    expect(result.kineticEnergyAfter).toBeCloseTo(result.kineticEnergyBefore, 6)
  })

  it('equal masses exchange velocities exactly', () => {
    // A textbook special case: m1 = m2 makes v1' = u2 and v2' = u1.
    const result = elasticCollision(2, 6, 2, -3)
    expect(result.body1.velocity).toBeCloseTo(-3, 6)
    expect(result.body2.velocity).toBeCloseTo(6, 6)
  })

  it('a stationary target is set moving and the projectile recoils, for unequal masses', () => {
    const result = elasticCollision(1, 5, 3, 0)
    expect(result.body2.velocity).toBeGreaterThan(0)
    expect(result.body1.velocity).toBeLessThan(5)
  })

  it('rejects non-positive mass', () => {
    expect(() => elasticCollision(0, 1, 1, 1)).toThrow()
    expect(() => elasticCollision(1, 1, -1, 1)).toThrow()
  })
})

describe('inelasticCollision', () => {
  it('conserves momentum but not kinetic energy', () => {
    const result = inelasticCollision(3, 4, 5, -2)
    expect(result.momentumAfter).toBeCloseTo(result.momentumBefore, 6)
    expect(result.kineticEnergyAfter).toBeLessThan(result.kineticEnergyBefore)
  })

  it('both bodies end at the same velocity, having stuck together', () => {
    const result = inelasticCollision(3, 4, 5, -2)
    expect(result.body1.velocity).toBe(result.body2.velocity)
  })

  it('two equal masses meeting at equal and opposite speed come to rest', () => {
    const result = inelasticCollision(2, 5, 2, -5)
    expect(result.body1.velocity).toBe(0)
    expect(result.momentumAfter).toBe(0)
  })

  it('rejects non-positive mass', () => {
    expect(() => inelasticCollision(0, 1, 1, 1)).toThrow()
  })
})
