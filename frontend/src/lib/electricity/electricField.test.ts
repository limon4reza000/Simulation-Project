import { describe, it, expect } from 'vitest'
import {
  electricField,
  forceOnCharge,
  fieldFromForce,
  electricPotential,
} from './electricField'

describe('electricField — E = kq/r², p. 283-286', () => {
  it('reproduces the book\'s own worked example exactly: 5 C at 10 m → 4.5e8 N/C', () => {
    expect(electricField(5, 10)).toBe(4.5e8)
  })

  it('follows the inverse-square law', () => {
    expect(electricField(1, 2)).toBeCloseTo(electricField(1, 1) / 4, 6)
  })

  it('rejects a non-positive distance', () => {
    expect(() => electricField(5, 0)).toThrow()
  })
})

describe('forceOnCharge / fieldFromForce — F = Eq, p. 284 & p. 286', () => {
  it('reproduces the book\'s own worked example exactly: F=10N on q=3C → E=3.33 N/C', () => {
    expect(fieldFromForce(10, 3)).toBeCloseTo(3.33, 2)
  })

  it('forceOnCharge and fieldFromForce are inverses', () => {
    const F = forceOnCharge(4.5e8, 5)
    expect(fieldFromForce(F, 5)).toBeCloseTo(4.5e8, -2)
  })

  it('rejects a zero charge in fieldFromForce', () => {
    expect(() => fieldFromForce(10, 0)).toThrow()
  })
})

describe('electricPotential — V(r) = kq/r, p. 288', () => {
  it('is positive for a positive charge, negative for a negative one', () => {
    expect(electricPotential(5, 10)).toBeGreaterThan(0)
    expect(electricPotential(-5, 10)).toBeLessThan(0)
  })

  it('falls off as 1/r, one power slower than the field', () => {
    expect(electricPotential(1, 2)).toBeCloseTo(electricPotential(1, 1) / 2, 6)
  })

  it('rejects a non-positive distance', () => {
    expect(() => electricPotential(5, 0)).toThrow()
  })
})
