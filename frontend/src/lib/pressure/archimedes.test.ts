import { describe, it, expect } from 'vitest'
import {
  buoyantForce,
  submergedFraction,
  floats,
  densityFromApparentLoss,
} from './archimedes'

describe('buoyantForce — F = Ahρg, p. 138', () => {
  it('equals the weight of the fluid displaced', () => {
    // 0.001 m³ submerged in water (1000 kg/m³): displaces 1 kg of water.
    expect(buoyantForce(0.001, 1000)).toBeCloseTo(9.8, 6)
  })

  it('scales with fluid density', () => {
    expect(buoyantForce(0.001, 13600)).toBeCloseTo(13.6 * buoyantForce(0.001, 1000), 3)
  })

  it('rejects non-positive volume or fluid density', () => {
    expect(() => buoyantForce(0, 1000)).toThrow()
    expect(() => buoyantForce(1, 0)).toThrow()
  })
})

describe('submergedFraction — p. 139', () => {
  it('reproduces the book\'s own worked example: wood in water → 50%', () => {
    expect(submergedFraction(500, 1000)).toBeCloseTo(0.5, 6)
  })

  it('reproduces the book\'s own worked example: same wood in sea water → 48.5%', () => {
    expect(submergedFraction(500, 1030)).toBeCloseTo(0.4854, 3)
  })

  it('is exactly 1 when the object\'s density equals the fluid\'s', () => {
    expect(submergedFraction(1000, 1000)).toBe(1)
  })

  it('rejects non-positive densities', () => {
    expect(() => submergedFraction(0, 1000)).toThrow()
    expect(() => submergedFraction(500, 0)).toThrow()
  })
})

describe('floats', () => {
  it('is true for wood in water (density 500 < 1000)', () => {
    expect(floats(500, 1000)).toBe(true)
  })

  it('is false for iron in water (density 7800 > 1000)', () => {
    expect(floats(7800, 1000)).toBe(false)
  })

  it('is false at exactly equal density — neutral buoyancy is not floating', () => {
    expect(floats(1000, 1000)).toBe(false)
  })
})

describe('densityFromApparentLoss — Archimedes\' crown problem, p. 140', () => {
  it('reproduces the book\'s own worked example exactly: 16,666 kg/m³', () => {
    // 10 kg in air, apparent 9.4 kg submerged in water (1000 kg/m³).
    expect(densityFromApparentLoss(10, 9.4, 1000)).toBeCloseTo(16666.67, 1)
  })

  it('recovers a fluid\'s own density for a body that just barely floats-not', () => {
    // A litre of pure water submerged in water loses exactly its own mass.
    expect(densityFromApparentLoss(1, 0, 1000)).toBe(1000)
  })

  it('rejects a submerged mass at or above the mass in air', () => {
    expect(() => densityFromApparentLoss(10, 10, 1000)).toThrow()
    expect(() => densityFromApparentLoss(10, 11, 1000)).toThrow()
  })

  it('rejects non-positive mass in air or fluid density', () => {
    expect(() => densityFromApparentLoss(0, -1, 1000)).toThrow()
    expect(() => densityFromApparentLoss(10, 9, 0)).toThrow()
  })
})
