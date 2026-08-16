import { describe, it, expect } from 'vitest'
import { criticalAngle, isTotalInternalReflection } from './criticalAngle'

describe('criticalAngle — θc = asin(nLight/nDense), p. 249-250', () => {
  it('reproduces the book\'s own worked example: glass in air → about 41.1-41.8°', () => {
    // Exact computation gives 41.14°; the book's own printed 41.8° comes
    // from first rounding n1/n2 to 0.66 and taking asin of that rounded
    // value — a compounding-rounding gap of the same shape documented
    // elsewhere in this codebase (see forceBalance.test.ts).
    expect(criticalAngle(1.52, 1)).toBeCloseTo(41.14, 0)
  })

  it('reproduces the book\'s own worked example: the same glass submerged in water → about 61.0-61.6°', () => {
    expect(criticalAngle(1.52, 1.33)).toBeCloseTo(61.04, 0)
  })

  it('reproduces the book\'s own optical-fibre worked example almost exactly: core/clad → 75°', () => {
    expect(criticalAngle(1.5, 1.45)).toBeCloseTo(75, 0)
  })

  it('a bigger index gap gives a smaller critical angle', () => {
    expect(criticalAngle(2.42, 1)).toBeLessThan(criticalAngle(1.33, 1))
  })

  it('rejects a denser index that is not actually denser', () => {
    expect(() => criticalAngle(1, 1.5)).toThrow()
    expect(() => criticalAngle(1.5, 1.5)).toThrow()
  })

  it('rejects non-positive indices', () => {
    expect(() => criticalAngle(0, 1)).toThrow()
  })
})

describe('isTotalInternalReflection', () => {
  it('is false below the critical angle', () => {
    expect(isTotalInternalReflection(1.52, 1, 30)).toBe(false)
  })

  it('is true above the critical angle', () => {
    expect(isTotalInternalReflection(1.52, 1, 60)).toBe(true)
  })

  it('reproduces the book\'s own p. 250-251 example: 1.45 medium into air at 75° totally reflects', () => {
    expect(isTotalInternalReflection(1.45, 1, 75)).toBe(true)
  })

  it('is false when leaving a less-dense medium (no such thing as TIR going that way)', () => {
    expect(isTotalInternalReflection(1, 1.5, 80)).toBe(false)
  })

  it('rejects an out-of-range incidence angle', () => {
    expect(() => isTotalInternalReflection(1.5, 1, 100)).toThrow()
  })
})
