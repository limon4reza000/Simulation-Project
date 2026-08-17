import { describe, it, expect } from 'vitest'
import { relativeFieldStrength } from './electromagnetStrength'

describe('relativeFieldStrength — strength ∝ current, ∝ turns, p. 335', () => {
  it('doubling current doubles strength, holding turns fixed', () => {
    const base = relativeFieldStrength(1, 50)
    expect(relativeFieldStrength(2, 50)).toBeCloseTo(2 * base, 6)
  })

  it('doubling turns doubles strength, holding current fixed', () => {
    const base = relativeFieldStrength(1, 50)
    expect(relativeFieldStrength(1, 100)).toBeCloseTo(2 * base, 6)
  })

  it('is zero with zero current, regardless of turns', () => {
    expect(relativeFieldStrength(0, 200)).toBe(0)
  })

  it('rejects negative current', () => {
    expect(() => relativeFieldStrength(-1, 50)).toThrow()
  })

  it('rejects non-positive or non-integer turns', () => {
    expect(() => relativeFieldStrength(1, 0)).toThrow()
    expect(() => relativeFieldStrength(1, 5.5)).toThrow()
  })
})
