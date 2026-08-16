import { describe, it, expect } from 'vitest'
import { lensPower, focalLengthFromPower } from './lensPower'

describe('focalLengthFromPower — f = 1/P, p. 265', () => {
  it('reproduces the book\'s own worked example exactly: 2.5 D → 0.4 m', () => {
    expect(focalLengthFromPower(2.5)).toBe(0.4)
  })

  it('rejects zero power', () => {
    expect(() => focalLengthFromPower(0)).toThrow()
  })
})

describe('lensPower — P = 1/f, p. 265', () => {
  it('is the inverse of focalLengthFromPower', () => {
    expect(lensPower(focalLengthFromPower(2.5))).toBeCloseTo(2.5, 6)
  })

  it('is positive for a convex (positive f) lens', () => {
    expect(lensPower(0.5)).toBeGreaterThan(0)
  })

  it('is negative for a concave (negative f) lens', () => {
    expect(lensPower(-0.5)).toBeLessThan(0)
  })

  it('a shorter focal length gives a larger-magnitude power', () => {
    expect(Math.abs(lensPower(0.1))).toBeGreaterThan(Math.abs(lensPower(1)))
  })

  it('rejects a zero focal length', () => {
    expect(() => lensPower(0)).toThrow()
  })
})
