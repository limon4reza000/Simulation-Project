import { describe, it, expect } from 'vitest'
import { kineticEnergy, potentialEnergy, maxHeight, stateAtHeight } from './energyConversion'

describe('kineticEnergy — T = ½mv², p. 104', () => {
  it('reproduces the book\'s own worked example: 10 kg at 10 m/s → 500 J', () => {
    expect(kineticEnergy(10, 10)).toBe(500)
  })

  it('reproduces the 20 m/s case from the same example: 2000 J', () => {
    expect(kineticEnergy(10, 20)).toBe(2000)
  })

  it('quadruples when speed doubles, as the book states explicitly (p. 105)', () => {
    const base = kineticEnergy(5, 4)
    expect(kineticEnergy(5, 8)).toBeCloseTo(4 * base, 6)
  })

  it('rejects non-positive mass', () => {
    expect(() => kineticEnergy(0, 5)).toThrow()
  })
})

describe('potentialEnergy — V = mgh, p. 108', () => {
  it('is zero at zero height', () => {
    expect(potentialEnergy(10, 0)).toBe(0)
  })

  it('scales linearly with height', () => {
    expect(potentialEnergy(10, 20)).toBeCloseTo(2 * potentialEnergy(10, 10), 6)
  })
})

describe('maxHeight — p. 109, thrown upward at 100 m/s', () => {
  it('reproduces the book\'s own worked example: 510 m', () => {
    expect(maxHeight(100)).toBeCloseTo(510.2, 1)
  })

  it('does not depend on mass — the book makes this point explicitly', () => {
    // maxHeight itself takes no mass argument; this test documents why: the
    // book shows m cancels out of ½mu² = mgh algebraically (p. 109).
    expect(maxHeight(50)).toBeCloseTo((50 * 50) / (2 * 9.8), 6)
  })

  it('rejects a negative launch speed', () => {
    expect(() => maxHeight(-1)).toThrow()
  })
})

describe('stateAtHeight — energy conservation along the flight', () => {
  it('at height 0 (launch), all energy is kinetic', () => {
    const s = stateAtHeight(10, 20, 0)
    expect(s.potential).toBe(0)
    expect(s.kinetic).toBeCloseTo(s.total, 6)
  })

  it('at the peak, all energy is potential and speed is zero', () => {
    // Precision 2, not 3: maxHeight() rounds its result to 6 decimals before
    // this function differences it back against u² to recover speed, and
    // that rounding leaves a small residual under the square root — the
    // same compounding-rounding shape documented in forceBalance.test.ts.
    const peak = maxHeight(20)
    const s = stateAtHeight(10, 20, peak)
    expect(s.speed).toBeCloseTo(0, 2)
    expect(s.kinetic).toBeCloseTo(0, 1)
  })

  it('total energy is conserved at every height along the flight', () => {
    const launch = 30
    const total0 = stateAtHeight(5, launch, 0).total
    for (const h of [5, 10, 20, 30, maxHeight(launch)]) {
      expect(stateAtHeight(5, launch, h).total).toBeCloseTo(total0, 3)
    }
  })

  it('rejects a height above the body\'s reachable maximum', () => {
    const peak = maxHeight(10)
    expect(() => stateAtHeight(1, 10, peak + 5)).toThrow()
  })

  it('rejects non-positive mass', () => {
    expect(() => stateAtHeight(0, 10, 0)).toThrow()
  })
})
