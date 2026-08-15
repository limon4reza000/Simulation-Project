import { describe, it, expect } from 'vitest'
import {
  linearExpansionCoefficient,
  expandedLength,
  areaExpansionCoefficient,
  volumeExpansionCoefficient,
  expandedDensity,
} from './thermalExpansion'

describe('linearExpansionCoefficient — p. 168, copper rod worked example', () => {
  it('reproduces the book\'s own worked example exactly: 16.7e-6 /°C', () => {
    const alpha = linearExpansionCoefficient(10, 10.0167, 20, 120)
    expect(alpha).toBeCloseTo(16.7e-6, 8)
  })

  it('rejects a non-positive initial length or equal temperatures', () => {
    expect(() => linearExpansionCoefficient(0, 1, 0, 100)).toThrow()
    expect(() => linearExpansionCoefficient(1, 1.001, 50, 50)).toThrow()
  })
})

describe('expandedLength — the coefficient run forward, p. 168', () => {
  it('is the inverse of linearExpansionCoefficient', () => {
    const alpha = linearExpansionCoefficient(10, 10.0167, 20, 120)
    expect(expandedLength(10, alpha, 20, 120)).toBeCloseTo(10.0167, 4)
  })

  it('returns the original length when there is no temperature change', () => {
    expect(expandedLength(5, 1e-5, 20, 20)).toBe(5)
  })

  it('a larger alpha gives more expansion for the same temperature rise', () => {
    const small = expandedLength(1, 1e-6, 0, 100)
    const large = expandedLength(1, 1e-5, 0, 100)
    expect(large - 1).toBeGreaterThan(small - 1)
  })
})

describe('areaExpansionCoefficient / volumeExpansionCoefficient — β=2α, γ=3α, p. 170', () => {
  it('beta is exactly twice alpha', () => {
    expect(areaExpansionCoefficient(5e-6)).toBeCloseTo(1e-5, 10)
  })

  it('gamma is exactly three times alpha', () => {
    expect(volumeExpansionCoefficient(5e-6)).toBeCloseTo(1.5e-5, 10)
  })
})

describe('expandedDensity — p. 171, gold worked example', () => {
  it('reproduces the book\'s own worked example exactly: 19.22 g/cc', () => {
    const rho = expandedDensity(19.3, 14e-6, 0, 100)
    expect(rho).toBeCloseTo(19.22, 2)
  })

  it('density decreases as a heated solid expands', () => {
    const rho = expandedDensity(1000, 1e-5, 0, 500)
    expect(rho).toBeLessThan(1000)
  })

  it('rejects a non-positive initial density', () => {
    expect(() => expandedDensity(0, 1e-5, 0, 100)).toThrow()
  })
})
