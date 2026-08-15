import { describe, it, expect } from 'vitest'
import {
  cumulativeLength,
  totalLength,
  pointAtDistance,
  displacementFrom,
  stateAtDistance,
  type Point,
} from './pathGeometry'

/**
 * The book's figure ২.০৪ (p. 39) states two numeric relationships without
 * printing the underlying path coordinates: walking to point B covers 4 km of
 * path while the straight-line displacement A→B is 3 km, and continuing to C
 * makes the total path 6 km while the displacement A→C is 1.5 km.
 *
 * The fixture path below is constructed — not traced from the figure, whose
 * coordinates are not printed — so that it reproduces those exact two
 * relationships. That is a real check of the geometry against the book's
 * stated numbers, not a check against arbitrary coordinates.
 */

// A -> M -> B: an isoceles bend, |AM| = |MB| = 2, |AB| = 3, total path = 4.
const A: Point = { x: 0, y: 0 }
const M: Point = { x: 1.5, y: Math.sqrt(4 - 1.5 ** 2) }
const B: Point = { x: 3, y: 0 }
// B -> C: |BC| = 2, |AC| = 1.5, so the path to C totals 6 while displacement
// from A collapses to 1.5 — larger distance walked, smaller net displacement.
const C: Point = { x: 7.25 / 6, y: Math.sqrt(2.25 - (7.25 / 6) ** 2) }

const bookPath: Point[] = [A, M, B, C]

describe('the book’s own relationship — চিত্র ২.০৪, p. 39', () => {
  it('path distance to B is 4 km while displacement A→B is 3 km', () => {
    expect(totalLength([A, M, B])).toBeCloseTo(4, 6)
    expect(displacementFrom(A, B).magnitude).toBeCloseTo(3, 6)
  })

  it('continuing to C: total distance 6 km, displacement collapses to 1.5 km', () => {
    expect(totalLength(bookPath)).toBeCloseTo(6, 6)
    expect(displacementFrom(A, C).magnitude).toBeCloseTo(1.5, 6)
  })

  it('more distance walked does not mean more displacement gained', () => {
    // The book's point: distance only ever accumulates; displacement can
    // shrink as the walker doubles back toward the start.
    const toB = stateAtDistance(bookPath, 4)
    const toC = stateAtDistance(bookPath, 6)
    expect(toC.distanceTravelled).toBeGreaterThan(toB.distanceTravelled)
    expect(toC.displacement.magnitude).toBeLessThan(toB.displacement.magnitude)
  })
})

describe('cumulativeLength', () => {
  it('starts at zero for the first point', () => {
    expect(cumulativeLength(bookPath)[0]).toBe(0)
  })

  it('is non-decreasing along the path', () => {
    const totals = cumulativeLength(bookPath)
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeGreaterThanOrEqual(totals[i - 1])
    }
  })

  it('is empty for an empty path', () => {
    expect(cumulativeLength([])).toEqual([])
  })
})

describe('pointAtDistance', () => {
  it('returns the start point at distance 0', () => {
    expect(pointAtDistance(bookPath, 0)).toEqual({ x: 0, y: 0 })
  })

  it('returns the end point at or beyond the total length', () => {
    // pointAtDistance rounds to 4 decimal places for display; match that.
    const end = pointAtDistance(bookPath, 1000)
    expect(end.x).toBeCloseTo(C.x, 4)
    expect(end.y).toBeCloseTo(C.y, 4)
  })

  it('clamps a negative distance to the start rather than extrapolating', () => {
    expect(pointAtDistance(bookPath, -5)).toEqual({ x: 0, y: 0 })
  })

  it('interpolates linearly within a segment', () => {
    // Halfway along the first segment A->M.
    const half = pointAtDistance(bookPath, 1) // |AM| = 2, so distance 1 is the midpoint
    expect(half.x).toBeCloseTo((A.x + M.x) / 2, 4)
    expect(half.y).toBeCloseTo((A.y + M.y) / 2, 4)
  })

  it('handles a single-point path without throwing', () => {
    expect(pointAtDistance([A], 5)).toEqual(A)
  })

  it('rejects an empty path', () => {
    expect(() => pointAtDistance([], 1)).toThrow()
  })
})

describe('displacementFrom', () => {
  it('is zero when start and current coincide', () => {
    const d = displacementFrom(A, A)
    expect(d.magnitude).toBe(0)
  })

  it('is a vector: distinct dx/dy give the same magnitude but different angle', () => {
    const east = displacementFrom({ x: 0, y: 0 }, { x: 3, y: 0 })
    const north = displacementFrom({ x: 0, y: 0 }, { x: 0, y: 3 })
    expect(east.magnitude).toBeCloseTo(north.magnitude, 6)
    expect(east.angleDeg).not.toBeCloseTo(north.angleDeg, 1)
  })

  it('reverses sign for the reverse displacement', () => {
    const there = displacementFrom(A, B)
    const back = displacementFrom(B, A)
    expect(back.dx).toBeCloseTo(-there.dx, 6)
    expect(back.dy).toBeCloseTo(-there.dy, 6)
  })
})

describe('stateAtDistance', () => {
  it('clamps distance travelled to the path length', () => {
    const state = stateAtDistance(bookPath, 9999)
    expect(state.distanceTravelled).toBeCloseTo(totalLength(bookPath), 6)
  })

  it('never reports negative distance travelled', () => {
    expect(stateAtDistance(bookPath, -10).distanceTravelled).toBe(0)
  })
})
