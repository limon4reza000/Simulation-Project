import { describe, it, expect } from 'vitest'
import {
  refractiveIndex,
  speedInMedium,
  refractionAngle,
  refractiveIndexFromAngles,
} from './snellsLaw'

describe('refractiveIndex / speedInMedium — n = c/v, p. 243-244', () => {
  it('reproduces the book\'s own worked example: water at 2.26e8 m/s → n = 1.33', () => {
    expect(refractiveIndex(2.26e8)).toBeCloseTo(1.33, 2)
  })

  it('reproduces the book\'s own worked example: glass n = 1.52 → about 2e8 m/s', () => {
    // The book's own printed "2×10⁸ m/s" is a 1-significant-figure rounding
    // of the true 1.9737×10⁸ m/s — checked against the precise value here,
    // with a tolerance wide enough to cover that rounding.
    expect(speedInMedium(1.52)).toBeCloseTo(1.9737e8, -5)
  })

  it('reproduces the book\'s own worked example: diamond n = 2.42 → v = 1.24e8 m/s', () => {
    expect(speedInMedium(2.42)).toBeCloseTo(1.24e8, -5)
  })

  it('round-trips', () => {
    expect(refractiveIndex(speedInMedium(1.5))).toBeCloseTo(1.5, 6)
  })

  it('rejects an index below 1 or a speed above c', () => {
    expect(() => speedInMedium(0.9)).toThrow()
    expect(() => refractiveIndex(4e8)).toThrow()
  })
})

describe('refractionAngle — Snell\'s law solved for θ2, p. 245', () => {
  it('reproduces the book\'s own worked example exactly: 45° into n=1.6 → 26°', () => {
    expect(refractionAngle(1, 1.6, 45)).toBeCloseTo(26, 0)
  })

  it('bends toward the normal entering a denser medium', () => {
    expect(refractionAngle(1, 1.5, 50)).toBeLessThan(50)
  })

  it('bends away from the normal entering a less dense medium', () => {
    expect(refractionAngle(1.5, 1, 20)).toBeGreaterThan(20)
  })

  it('throws when the geometry demands total internal reflection', () => {
    expect(() => refractionAngle(1.5, 1, 70)).toThrow()
  })

  it('rejects non-positive indices or an out-of-range incidence angle', () => {
    expect(() => refractionAngle(0, 1.5, 30)).toThrow()
    expect(() => refractionAngle(1, 1.5, 90)).toThrow()
  })
})

describe('refractiveIndexFromAngles — Snell\'s law solved for n2, p. 246', () => {
  it('reproduces the book\'s own worked example exactly: 60° -> 45° gives n2 = 1.22', () => {
    expect(refractiveIndexFromAngles(1, 60, 45)).toBeCloseTo(1.22, 1)
  })

  it('rejects non-positive n1 or out-of-range angles', () => {
    expect(() => refractiveIndexFromAngles(0, 60, 45)).toThrow()
    expect(() => refractiveIndexFromAngles(1, 0, 45)).toThrow()
    expect(() => refractiveIndexFromAngles(1, 60, 90)).toThrow()
  })
})
