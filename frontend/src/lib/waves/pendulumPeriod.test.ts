import { describe, it, expect } from 'vitest'
import { pendulumPeriod, springPeriod, pendulumFrequency } from './pendulumPeriod'

describe('pendulumPeriod — T = 2π√(l/g), p. 188-189', () => {
  it('reproduces the book\'s own worked example exactly: 1 m → 2.0 s', () => {
    expect(pendulumPeriod(1)).toBeCloseTo(2.0, 1)
  })

  it('a longer pendulum has a longer period', () => {
    expect(pendulumPeriod(4)).toBeGreaterThan(pendulumPeriod(1))
  })

  it('period scales with the square root of length: 4x length gives 2x period', () => {
    expect(pendulumPeriod(4)).toBeCloseTo(2 * pendulumPeriod(1), 4)
  })

  it('rejects a non-positive length', () => {
    expect(() => pendulumPeriod(0)).toThrow()
  })
})

describe('springPeriod — T = 2π√(m/k), p. 188', () => {
  it('a larger mass gives a longer period', () => {
    expect(springPeriod(4, 10)).toBeGreaterThan(springPeriod(1, 10))
  })

  it('a stiffer spring (larger k) gives a shorter period', () => {
    expect(springPeriod(1, 40)).toBeLessThan(springPeriod(1, 10))
  })

  it('rejects non-positive mass or spring constant', () => {
    expect(() => springPeriod(0, 10)).toThrow()
    expect(() => springPeriod(1, 0)).toThrow()
  })
})

describe('pendulumFrequency', () => {
  it('is the reciprocal of the period', () => {
    const T = pendulumPeriod(1)
    expect(pendulumFrequency(1)).toBeCloseTo(1 / T, 4)
  })
})
