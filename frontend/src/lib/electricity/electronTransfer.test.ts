import { describe, it, expect } from 'vitest'
import {
  chargeFromElectronCount,
  electronCountFromCharge,
  rubCharges,
} from './electronTransfer'

describe('chargeFromElectronCount — charge is quantised, p. 272-273', () => {
  it('one electron carries exactly -1.6e-19 C', () => {
    expect(chargeFromElectronCount(1)).toBe(-1.6e-19)
  })

  it('a million electrons carry exactly a million times that', () => {
    expect(chargeFromElectronCount(1_000_000)).toBeCloseTo(-1.6e-13, 20)
  })

  it('a positive sign gives a positive charge of the same magnitude', () => {
    expect(chargeFromElectronCount(5, 1)).toBe(5 * 1.6e-19)
  })

  it('zero electrons gives zero charge', () => {
    // toBeCloseTo, not toBe: sign * 0 can produce -0 in JS, which Object.is
    // (what .toBe uses) treats as distinct from +0, though they are
    // numerically equal.
    expect(chargeFromElectronCount(0)).toBeCloseTo(0, 30)
  })

  it('rejects a non-integer or negative electron count', () => {
    expect(() => chargeFromElectronCount(1.5)).toThrow()
    expect(() => chargeFromElectronCount(-1)).toThrow()
  })
})

describe('electronCountFromCharge', () => {
  it('is the inverse of chargeFromElectronCount', () => {
    expect(electronCountFromCharge(chargeFromElectronCount(42))).toBe(42)
  })

  it('works regardless of sign', () => {
    expect(electronCountFromCharge(1.6e-19)).toBe(1)
    expect(electronCountFromCharge(-1.6e-19)).toBe(1)
  })
})

describe('rubCharges — glass/silk, plastic/flannel, p. 274', () => {
  it('the giver and taker end up equal and opposite', () => {
    const { giverCharge, takerCharge } = rubCharges(1000)
    expect(giverCharge).toBeCloseTo(-takerCharge, 20)
  })

  it('the taker (the one that gains electrons) ends up negative', () => {
    expect(rubCharges(500).takerCharge).toBeLessThan(0)
  })

  it('the giver ends up positive by exactly as many elementary charges as transferred', () => {
    const { giverCharge } = rubCharges(500)
    expect(electronCountFromCharge(giverCharge)).toBe(500)
  })
})
