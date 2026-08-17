import { describe, it, expect } from 'vitest'
import { current, voltage, resistanceFromOhmsLaw } from './ohmsLaw'

describe('current — I = V/R, p. 304-305', () => {
  it('1 V across 1 Ω drives exactly 1 A, the book\'s own definition', () => {
    expect(current(1, 1)).toBe(1)
  })

  it('is directly proportional to voltage for a fixed resistance', () => {
    expect(current(4, 2)).toBeCloseTo(2 * current(2, 2), 6)
  })

  it('rejects non-positive resistance', () => {
    expect(() => current(5, 0)).toThrow()
  })
})

describe('voltage — V = IR', () => {
  it('is the inverse of current', () => {
    expect(voltage(current(6, 3), 3)).toBeCloseTo(6, 6)
  })

  it('rejects non-positive resistance', () => {
    expect(() => voltage(1, 0)).toThrow()
  })
})

describe('resistanceFromOhmsLaw — R = V/I', () => {
  it('reproduces the book\'s own defining case: 1V / 1A = 1 ohm', () => {
    expect(resistanceFromOhmsLaw(1, 1)).toBe(1)
  })

  it('is the inverse of current', () => {
    const R = 7
    const I = current(21, R)
    expect(resistanceFromOhmsLaw(21, I)).toBeCloseTo(R, 6)
  })

  it('rejects non-positive current', () => {
    expect(() => resistanceFromOhmsLaw(5, 0)).toThrow()
  })
})
