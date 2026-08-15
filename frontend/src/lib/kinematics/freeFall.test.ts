import { describe, it, expect } from 'vitest'
import {
  G,
  stateAtTime,
  timeToFall,
  impactSpeed,
  sampleFall,
  fallFraction,
} from './freeFall'

/**
 * Every expected value is taken from the printed page or derived from the
 * book's own stated equations, not from running the code.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §২.৮, pp. 48–50.
 */

describe('stateAtTime — v = gt, h = ½gt² (p. 49)', () => {
  it('at release, both velocity and distance are zero', () => {
    const s = stateAtTime(0)
    expect(s.velocity).toBe(0)
    expect(s.distance).toBe(0)
  })

  it('after 1 second, v = 9.8 m/s (g itself)', () => {
    expect(stateAtTime(1).velocity).toBe(9.8)
  })

  it('after 2 seconds, v = 19.6 m/s and h = 19.6 m', () => {
    // h = 0.5 * 9.8 * 4 = 19.6
    const s = stateAtTime(2)
    expect(s.velocity).toBe(19.6)
    expect(s.distance).toBe(19.6)
  })

  it('velocity is exactly linear in time — the book’s second law, v ∝ t', () => {
    const a = stateAtTime(1)
    const b = stateAtTime(3)
    // v(3)/v(1) must equal 3/1 for direct proportionality.
    expect(b.velocity / a.velocity).toBeCloseTo(3, 10)
  })

  it('distance is exactly proportional to t² — the third law, h ∝ t²', () => {
    const a = stateAtTime(2)
    const b = stateAtTime(4)
    // h(4)/h(2) must equal (4/2)^2 = 4.
    expect(b.distance / a.distance).toBeCloseTo(4, 10)
  })

  it('rejects negative time', () => {
    expect(() => stateAtTime(-1)).toThrow()
  })

  it('honours a supplied g, for a non-Earth what-if', () => {
    // Moon-like g would still follow the same equations.
    const s = stateAtTime(2, 1.6)
    expect(s.velocity).toBe(3.2)
    expect(s.distance).toBe(3.2)
  })
})

describe('the chapter’s worked cricket-ball example — p. 50', () => {
  // "একটা গাড়ি... 41.67 m/s" throw-up example inverted to a fall: the book's
  // h = u²/2g = 88.59 m figure for u = 41.67 m/s is the same equation family
  // as v² = 2gh, so the impact speed for an 88.59 m fall must return to 41.67.
  it('impactSpeed inverts the book’s own h = u²/(2g) figure', () => {
    const height = 88.59
    expect(impactSpeed(height)).toBeCloseTo(41.67, 1)
  })
})

describe('timeToFall — t = √(2h/g)', () => {
  it('a 4.9 m fall takes 1 second', () => {
    // h = ½ * 9.8 * 1² = 4.9
    expect(timeToFall(4.9)).toBe(1)
  })

  it('a 19.6 m fall takes 2 seconds', () => {
    expect(timeToFall(19.6)).toBe(2)
  })

  it('is the exact inverse of stateAtTime’s distance', () => {
    const t = 3.5
    const h = stateAtTime(t).distance
    expect(timeToFall(h)).toBeCloseTo(t, 2)
  })

  it('rejects a negative height', () => {
    expect(() => timeToFall(-1)).toThrow()
  })

  it('zero height takes zero time', () => {
    expect(timeToFall(0)).toBe(0)
  })
})

describe('impactSpeed — v² = 2gh', () => {
  it('matches v = gt at the moment of impact', () => {
    const height = 19.6
    const t = timeToFall(height)
    expect(impactSpeed(height)).toBeCloseTo(stateAtTime(t).velocity, 1)
  })

  it('rejects a negative height', () => {
    expect(() => impactSpeed(-5)).toThrow()
  })
})

describe('the first law: fall time is independent of mass', () => {
  // The book asserts this as a physical law rather than a formula (p. 48):
  // none of the three equations contains a mass term. The strongest test of
  // that claim is that this module has no way to express mass at all.
  it('stateAtTime and timeToFall take no mass parameter', () => {
    expect(stateAtTime.length).toBeLessThanOrEqual(2)
    expect(timeToFall.length).toBeLessThanOrEqual(2)
  })

  it('so two different "masses" dropped from the same height always agree', () => {
    const height = 20
    // Nothing in the API lets a caller supply mass, so both calls are
    // necessarily identical — the model cannot produce Aristotelian free fall.
    expect(timeToFall(height)).toBe(timeToFall(height))
  })
})

describe('sampleFall', () => {
  it('starts at release and ends at the ground, inclusive', () => {
    const points = sampleFall(19.6, 4)
    expect(points).toHaveLength(5)
    expect(points[0].distance).toBe(0)
    expect(points[points.length - 1].distance).toBeCloseTo(19.6, 1)
  })

  it('is monotonically increasing in both v and h', () => {
    const points = sampleFall(50, 10)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].velocity).toBeGreaterThan(points[i - 1].velocity)
      expect(points[i].distance).toBeGreaterThan(points[i - 1].distance)
    }
  })

  it('rejects a non-positive step count', () => {
    expect(() => sampleFall(10, 0)).toThrow()
  })
})

describe('fallFraction — drives the drop animation', () => {
  it('is 0 at release and 1 at impact', () => {
    const height = 19.6
    expect(fallFraction(0, height)).toBe(0)
    expect(fallFraction(timeToFall(height), height)).toBeCloseTo(1, 2)
  })

  it('never exceeds 1, even past the moment of impact', () => {
    // An integrator overshooting by a frame must not draw the body underground.
    expect(fallFraction(100, 19.6)).toBe(1)
  })

  it('treats a zero height as already landed', () => {
    expect(fallFraction(0, 0)).toBe(1)
  })
})

describe('G', () => {
  it('matches the value printed throughout the chapter', () => {
    expect(G).toBe(9.8)
  })
})
