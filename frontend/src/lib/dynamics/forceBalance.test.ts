import { describe, it, expect } from 'vitest'
import { toCartesian, toVector, resultant, isBalanced, equilibrant } from './forceBalance'

/**
 * The book's own examples in §৩.৩ (pp. 69–70) are qualitative — a pendulum, a
 * book held taut by two hands — rather than numeric, so these tests check the
 * vector algebra directly rather than a page-printed figure.
 */

describe('toCartesian / toVector — inverses of each other', () => {
  it('round-trips a vector through Cartesian and back', () => {
    // Precision 5, not 6: toCartesian and toVector each round to 6 decimals,
    // and the two roundings can compound to just over a 6-decimal tolerance —
    // a display-precision artefact, not an error in the vector algebra.
    const v = { magnitude: 10, angleDeg: 37 }
    const back = toVector(toCartesian(v))
    expect(back.magnitude).toBeCloseTo(v.magnitude, 5)
    expect(back.angleDeg).toBeCloseTo(v.angleDeg, 5)
  })

  it('a force along +x has angle 0', () => {
    expect(toCartesian({ magnitude: 5, angleDeg: 0 })).toEqual({ x: 5, y: 0 })
  })

  it('a force along +y has angle 90', () => {
    const c = toCartesian({ magnitude: 5, angleDeg: 90 })
    expect(c.x).toBeCloseTo(0, 6)
    expect(c.y).toBeCloseTo(5, 6)
  })

  it('the zero vector has angle 0 by convention, not NaN', () => {
    expect(toVector({ x: 0, y: 0 })).toEqual({ magnitude: 0, angleDeg: 0 })
  })
})

describe('resultant — the book’s “সম্মিলিত লব্ধি”, p. 69', () => {
  it('two equal and opposite forces cancel to zero', () => {
    const r = resultant([
      { magnitude: 10, angleDeg: 0 },
      { magnitude: 10, angleDeg: 180 },
    ])
    expect(r.magnitude).toBeCloseTo(0, 6)
  })

  it('two forces at right angles combine by Pythagoras', () => {
    const r = resultant([
      { magnitude: 3, angleDeg: 0 },
      { magnitude: 4, angleDeg: 90 },
    ])
    expect(r.magnitude).toBeCloseTo(5, 6)
    expect(r.angleDeg).toBeCloseTo(Math.atan2(4, 3) * (180 / Math.PI), 4)
  })

  it('two forces in the same direction add directly', () => {
    const r = resultant([
      { magnitude: 3, angleDeg: 20 },
      { magnitude: 4, angleDeg: 20 },
    ])
    expect(r.magnitude).toBeCloseTo(7, 6)
    expect(r.angleDeg).toBeCloseTo(20, 4)
  })

  it('a single force is its own resultant', () => {
    const f = { magnitude: 8, angleDeg: 55 }
    const r = resultant([f])
    expect(r.magnitude).toBeCloseTo(f.magnitude, 5) // see rounding note above
    expect(r.angleDeg).toBeCloseTo(f.angleDeg, 5)
  })

  it('no forces gives zero resultant', () => {
    expect(resultant([]).magnitude).toBe(0)
  })

  it('combines three forces correctly — the tug-of-war-on-a-book case, p. 70', () => {
    // Two hands pulling outward at an angle, held taut by gravity below —
    // qualitatively the চিত্র ৩.০৩ setup: three forces, generally unbalanced
    // unless chosen to cancel.
    const r = resultant([
      { magnitude: 5, angleDeg: 45 },
      { magnitude: 5, angleDeg: 135 },
      { magnitude: 7.07, angleDeg: 270 },
    ])
    // The two 45/135-degree pulls cancel horizontally and add to ~7.07 N
    // straight up; the downward 7.07 N should very nearly balance it.
    expect(r.magnitude).toBeCloseTo(0, 1)
  })
})

describe('isBalanced — the book’s equilibrium condition, p. 69', () => {
  it('is true when forces sum to zero', () => {
    expect(
      isBalanced([
        { magnitude: 6, angleDeg: 0 },
        { magnitude: 6, angleDeg: 180 },
      ]),
    ).toBe(true)
  })

  it('is false for a clearly unbalanced set', () => {
    expect(isBalanced([{ magnitude: 6, angleDeg: 0 }])).toBe(false)
  })

  it('tolerates near-zero rather than demanding exact cancellation', () => {
    expect(
      isBalanced([
        { magnitude: 6, angleDeg: 0 },
        { magnitude: 6.01, angleDeg: 180 },
      ]),
    ).toBe(true)
  })
})

describe('equilibrant', () => {
  it('has the same magnitude and opposite direction to the resultant', () => {
    const forces = [
      { magnitude: 5, angleDeg: 0 },
      { magnitude: 3, angleDeg: 90 },
    ]
    const r = resultant(forces)
    const e = equilibrant(forces)
    expect(e.magnitude).toBeCloseTo(r.magnitude, 6)
    expect(Math.abs(e.angleDeg - r.angleDeg)).toBeCloseTo(180, 1)
  })

  it('adding the equilibrant to the original forces balances them', () => {
    const forces = [
      { magnitude: 5, angleDeg: 20 },
      { magnitude: 3, angleDeg: 200 },
    ]
    const e = equilibrant(forces)
    expect(isBalanced([...forces, e])).toBe(true)
  })
})
