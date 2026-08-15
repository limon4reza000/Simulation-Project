import { describe, it, expect } from 'vitest'
import {
  sinTheta,
  inclineAcceleration,
  timeToRoll,
  finalSpeed,
  averageSpeed,
  sampleRoll,
  rollFraction,
  recordTrial,
  G,
} from './inclinedPlane'

/**
 * অনুসন্ধান ২.০১ has no printed worked example — it is a "do it yourself"
 * investigation with no answer key (book pp. 54–56). These tests therefore
 * check the model against the equations of motion the book itself establishes
 * in §২.৭ (v = at, s = ½at²), not against a page-printed number. Where a test
 * says "book", it means the general kinematic relationship, not a specific
 * figure — that distinction is worth keeping straight, since it is different
 * from how the Chapter 1 caliper tests were justified.
 */

describe('sinTheta — h/L, as the book defines it (p. 55)', () => {
  it('a 1 m rise over a 5 m ramp gives sin θ = 0.2', () => {
    expect(sinTheta(1, 5)).toBe(0.2)
  })

  it('a flat ramp has sin θ = 0', () => {
    expect(sinTheta(0, 5)).toBe(0)
  })

  it('a vertical drop has sin θ = 1', () => {
    expect(sinTheta(5, 5)).toBe(1)
  })

  it('rejects a height taller than the ramp itself', () => {
    expect(() => sinTheta(6, 5)).toThrow()
  })

  it('rejects a non-positive length', () => {
    expect(() => sinTheta(1, 0)).toThrow()
  })
})

describe('inclineAcceleration — a = g sin θ', () => {
  it('a 30-degree-equivalent slope (sin θ = 0.5) gives half of g', () => {
    expect(inclineAcceleration(2.5, 5)).toBe(4.9)
  })

  it('a flat surface gives zero acceleration', () => {
    expect(inclineAcceleration(0, 5)).toBe(0)
  })

  it('honours a supplied g', () => {
    expect(inclineAcceleration(2.5, 5, 10)).toBe(5)
  })
})

describe('timeToRoll — inverted from L = ½at²', () => {
  it('a steeper incline takes less time to cover the same length', () => {
    const shallow = timeToRoll(1, 5)
    const steep = timeToRoll(3, 5)
    expect(steep).toBeLessThan(shallow)
  })

  it('a flat "incline" never finishes — Infinity, not a crash', () => {
    expect(timeToRoll(0, 5)).toBe(Infinity)
  })

  it('matches s = ½at² when run back through the acceleration', () => {
    const h = 2
    const L = 6
    const a = inclineAcceleration(h, L)
    const t = timeToRoll(h, L)
    expect(0.5 * a * t * t).toBeCloseTo(L, 1)
  })
})

describe('finalSpeed — v = at, equivalently √(2aL)', () => {
  it('agrees with the √(2aL) form of the same equation', () => {
    const h = 2
    const L = 6
    const a = inclineAcceleration(h, L)
    expect(finalSpeed(h, L)).toBeCloseTo(Math.sqrt(2 * a * L), 1)
  })

  it('is zero on a flat surface', () => {
    expect(finalSpeed(0, 5)).toBe(0)
  })
})

describe('averageSpeed — L/t, as the book computes it (p. 55 step 6)', () => {
  it('equals half the final speed for constant acceleration from rest', () => {
    // Standard result: average of a linear ramp from 0 to v is v/2.
    const h = 2
    const L = 6
    expect(averageSpeed(h, L)).toBeCloseTo(finalSpeed(h, L) / 2, 1)
  })

  it('increases with steepness for a fixed ramp length', () => {
    const shallow = averageSpeed(1, 5)
    const steep = averageSpeed(3, 5)
    expect(steep).toBeGreaterThan(shallow)
  })

  it('is zero on a flat surface, not a division error', () => {
    expect(averageSpeed(0, 5)).toBe(0)
  })
})

describe('sampleRoll', () => {
  it('starts at rest and ends at the ramp length', () => {
    const points = sampleRoll(2, 6, 10)
    expect(points[0].distance).toBe(0)
    expect(points[0].speed).toBe(0)
    expect(points[points.length - 1].distance).toBeCloseTo(6, 1)
  })

  it('is monotonically increasing in both distance and speed', () => {
    const points = sampleRoll(3, 8, 12)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].distance).toBeGreaterThan(points[i - 1].distance)
      expect(points[i].speed).toBeGreaterThan(points[i - 1].speed)
    }
  })

  it('degrades to a single point on a flat surface rather than looping forever', () => {
    expect(sampleRoll(0, 5, 10)).toHaveLength(1)
  })

  it('rejects a non-positive step count', () => {
    expect(() => sampleRoll(2, 5, 0)).toThrow()
  })
})

describe('rollFraction — drives the ball animation', () => {
  it('is 0 at release and 1 at the foot of the ramp', () => {
    const h = 2
    const L = 6
    expect(rollFraction(0, h, L)).toBe(0)
    expect(rollFraction(timeToRoll(h, L), h, L)).toBeCloseTo(1, 2)
  })

  it('never exceeds 1 past the moment the ball reaches the bottom', () => {
    expect(rollFraction(1000, 2, 6)).toBe(1)
  })

  it('is 0 on a flat surface rather than dividing by zero', () => {
    expect(rollFraction(1, 0, 5)).toBe(0)
  })
})

describe('recordTrial — one row of the book’s results table', () => {
  it('bundles the inputs a student measured with the values they compute', () => {
    const row = recordTrial(2, 6)
    expect(row.heightM).toBe(2)
    expect(row.lengthM).toBe(6)
    expect(row.sinTheta).toBe(sinTheta(2, 6))
    expect(row.timeS).toBe(timeToRoll(2, 6))
    expect(row.averageSpeedMs).toBe(averageSpeed(2, 6))
  })
})

describe('G', () => {
  it('matches the value used throughout the chapter', () => {
    expect(G).toBe(9.8)
  })
})
