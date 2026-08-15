import { describe, it, expect } from 'vitest'
import {
  midpointDerivative,
  deriveVelocity,
  deriveAcceleration,
  toSamples,
  TABLE_2_01_SET_1,
  TABLE_2_01_SET_2,
} from './motionGrapher'

/**
 * Expected values come from the book's own টেবিল ২.০১ dataset (s = t², p. 51),
 * not from running the code — and from the exact algebra of the midpoint
 * method, which the calculations below double-check independently.
 */

describe('midpointDerivative', () => {
  it('rejects fewer than two samples', () => {
    expect(() => midpointDerivative([{ t: 0, value: 0 }])).toThrow()
  })

  it('rejects non-increasing times', () => {
    expect(() =>
      midpointDerivative([
        { t: 1, value: 0 },
        { t: 1, value: 5 },
      ]),
    ).toThrow()
  })

  it('produces one fewer point than it was given', () => {
    expect(midpointDerivative(TABLE_2_01_SET_1)).toHaveLength(
      TABLE_2_01_SET_1.length - 1,
    )
  })

  it('a constant series has zero rate throughout', () => {
    const flat = toSamples([0, 1, 2, 3], [5, 5, 5, 5])
    for (const point of midpointDerivative(flat)) {
      expect(point.value).toBe(0)
    }
  })

  it('a straight line recovers its own slope exactly', () => {
    const line = toSamples([0, 1, 2, 3, 4], [0, 3, 6, 9, 12]) // s = 3t
    for (const point of midpointDerivative(line)) {
      expect(point.value).toBe(3)
    }
  })
})

describe('deriveVelocity — টেবিল ২.০১, set 1 (s = t²), p. 51', () => {
  const v = deriveVelocity(TABLE_2_01_SET_1)

  it('recovers v = 2t exactly at each interval midpoint', () => {
    // The midpoint method is exact for a quadratic, so v(0.5)=1, v(1.5)=3, …
    const expected = [
      { t: 0.5, value: 1 },
      { t: 1.5, value: 3 },
      { t: 2.5, value: 5 },
      { t: 3.5, value: 7 },
      { t: 4.5, value: 9 },
    ]
    expect(v).toEqual(expected)
  })

  it('is linear in time — the chapter’s v ∝ t relationship made visible', () => {
    for (let i = 1; i < v.length; i++) {
      const slope = (v[i].value - v[i - 1].value) / (v[i].t - v[i - 1].t)
      expect(slope).toBe(2)
    }
  })
})

describe('deriveAcceleration — same dataset', () => {
  const a = deriveAcceleration(TABLE_2_01_SET_1)

  it('is constant at 2, matching s = t² analytically (a = 2s̈)', () => {
    for (const point of a) {
      expect(point.value).toBe(2)
    }
  })

  it('has one fewer point than the derived velocity series', () => {
    expect(a).toHaveLength(deriveVelocity(TABLE_2_01_SET_1).length - 1)
  })
})

describe('the second book dataset — s = 1.5t², p. 51', () => {
  it('gives a different, still-constant acceleration', () => {
    const a = deriveAcceleration(TABLE_2_01_SET_2)
    // s = 1.5t² analytically has acceleration 3.
    for (const point of a) {
      expect(point.value).toBe(3)
    }
  })

  it('distinguishes the two datasets by their derived acceleration', () => {
    const a1 = deriveAcceleration(TABLE_2_01_SET_1)[0].value
    const a2 = deriveAcceleration(TABLE_2_01_SET_2)[0].value
    expect(a1).not.toBe(a2)
  })
})

describe('toSamples', () => {
  it('zips parallel arrays into samples', () => {
    expect(toSamples([0, 1], [10, 20])).toEqual([
      { t: 0, value: 10 },
      { t: 1, value: 20 },
    ])
  })

  it('rejects mismatched lengths', () => {
    expect(() => toSamples([0, 1, 2], [10, 20])).toThrow()
  })
})
