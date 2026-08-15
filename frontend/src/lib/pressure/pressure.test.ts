import { describe, it, expect } from 'vitest'
import { pressure, weightFromMass } from './pressure'

describe('pressure — P = F/A, p. 129', () => {
  it('reproduces the book\'s own worked example: standing (16,333 N/m²)', () => {
    // 50 kg person, feet area 0.03 m².
    const weight = weightFromMass(50)
    expect(pressure(weight, 0.03)).toBeCloseTo(16333.33, 1)
  })

  it('reproduces the book\'s own worked example: lying (980 N/m²)', () => {
    // Same person, back area 0.5 m².
    const weight = weightFromMass(50)
    expect(pressure(weight, 0.5)).toBeCloseTo(980, 6)
  })

  it('a larger contact area gives a smaller pressure for the same force', () => {
    const weight = weightFromMass(50)
    expect(pressure(weight, 0.5)).toBeLessThan(pressure(weight, 0.03))
  })

  it('rejects non-positive area', () => {
    expect(() => pressure(100, 0)).toThrow()
  })
})

describe('weightFromMass — F = mg', () => {
  it('reproduces the book\'s own worked example: 50 kg → 490 N', () => {
    expect(weightFromMass(50)).toBe(490)
  })

  it('rejects non-positive mass', () => {
    expect(() => weightFromMass(0)).toThrow()
  })
})
