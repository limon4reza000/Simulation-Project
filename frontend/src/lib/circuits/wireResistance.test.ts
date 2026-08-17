import { describe, it, expect } from 'vitest'
import {
  circularArea,
  wireResistance,
  lengthForResistance,
  conductivity,
  MATERIALS,
} from './wireResistance'

describe('circularArea — A = πr², p. 309', () => {
  it('reproduces the book\'s own worked example: r = 0.1 mm → A ≈ 3.14e-8 m²', () => {
    expect(circularArea(0.0001)).toBeCloseTo(3.14e-8, 9)
  })

  it('rejects a non-positive radius', () => {
    expect(() => circularArea(0)).toThrow()
  })
})

describe('wireResistance — R = ρL/A, p. 306', () => {
  it('is the inverse of lengthForResistance', () => {
    const L = lengthForResistance(1.68e-8, 1, 3.14e-8)
    expect(wireResistance(1.68e-8, L, 3.14e-8)).toBeCloseTo(1, 4)
  })

  it('rejects non-positive resistivity, length, or area', () => {
    expect(() => wireResistance(0, 1, 1)).toThrow()
    expect(() => wireResistance(1, 0, 1)).toThrow()
    expect(() => wireResistance(1, 1, 0)).toThrow()
  })
})

describe('lengthForResistance — realistic 0.1 mm-radius wire for 1 Ω, pp. 308-309', () => {
  // The book's own worked example uses its own rounded resistivities for
  // this specific page (1.6e-8, 1.7e-8, 5.5e-8, 100e-8), distinct in the
  // last digit from টেবিল ১১.০১'s more precise printed values — both are
  // the book's own numbers, just rounded differently on different pages.
  const A = 3.14e-8 // pi * (0.1 mm)^2

  it('reproduces the book\'s own worked example: silver → 1.96 m', () => {
    expect(lengthForResistance(1.6e-8, 1, A)).toBeCloseTo(1.96, 2)
  })

  it('reproduces the book\'s own worked example: copper → 1.84 m', () => {
    expect(lengthForResistance(1.7e-8, 1, A)).toBeCloseTo(1.84, 1)
  })

  it('reproduces the book\'s own worked example: tungsten → 0.57 m', () => {
    expect(lengthForResistance(5.5e-8, 1, A)).toBeCloseTo(0.57, 2)
  })

  it('reproduces the book\'s own worked example: nichrome → 0.03 m', () => {
    expect(lengthForResistance(100e-8, 1, A)).toBeCloseTo(0.03, 2)
  })

  it('rejects non-positive resistivity, target resistance, or area', () => {
    expect(() => lengthForResistance(0, 1, 1)).toThrow()
    expect(() => lengthForResistance(1, 0, 1)).toThrow()
    expect(() => lengthForResistance(1, 1, 0)).toThrow()
  })
})

describe('conductivity — σ = 1/ρ, p. 307', () => {
  it('is the reciprocal of resistivity', () => {
    expect(conductivity(0.5)).toBe(2)
  })

  it('a better conductor (lower resistivity) has higher conductivity', () => {
    expect(conductivity(1.68e-8)).toBeGreaterThan(conductivity(100e-8))
  })

  it('rejects non-positive resistivity', () => {
    expect(() => conductivity(0)).toThrow()
  })
})

describe('MATERIALS — টেবিল ১১.০১, p. 307', () => {
  it('has all five printed materials in the book\'s own order', () => {
    expect(MATERIALS.map((m) => m.key)).toEqual([
      'silver',
      'copper',
      'gold',
      'tungsten',
      'nichrome',
    ])
  })

  it('silver has the lowest resistivity, matching the book\'s own table', () => {
    const lowest = MATERIALS.reduce((a, b) => (b.resistivity < a.resistivity ? b : a))
    expect(lowest.key).toBe('silver')
  })
})
