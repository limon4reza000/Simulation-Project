import { describe, it, expect } from 'vitest'
import {
  strain,
  stress,
  stretchedLength,
  withinElasticLimit,
  nearestReading,
  RUBBER_BAND_DATA,
} from './hookesLaw'

describe('strain — (L - L0)/L0, p. 148', () => {
  it('is zero at the natural length', () => {
    expect(strain(0.5, 0.5)).toBe(0)
  })

  it('is unitless and scale-independent', () => {
    // Doubling both lengths together leaves the ratio unchanged.
    expect(strain(0.5, 0.6)).toBeCloseTo(strain(1, 1.2), 6)
  })

  it('rejects non-positive natural length or negative stretched length', () => {
    expect(() => strain(0, 1)).toThrow()
    expect(() => strain(1, -1)).toThrow()
  })
})

describe('stress — F/A, p. 148', () => {
  it('matches the plain pressure formula', () => {
    expect(stress(100, 0.01)).toBe(10000)
  })

  it('rejects non-positive area', () => {
    expect(() => stress(10, 0)).toThrow()
  })
})

describe('stretchedLength — Hooke\'s law rearranged, p. 149', () => {
  it('returns the natural length under zero force', () => {
    expect(stretchedLength(1, 0.001, 1e9, 0)).toBeCloseTo(1, 6)
  })

  it('stretches proportionally to force, within the elastic limit', () => {
    const l1 = stretchedLength(1, 0.001, 1e9, 100)
    const l2 = stretchedLength(1, 0.001, 1e9, 200)
    const extension1 = l1 - 1
    const extension2 = l2 - 1
    expect(extension2).toBeCloseTo(2 * extension1, 6)
  })

  it('a stiffer material (higher Y) stretches less under the same load', () => {
    const soft = stretchedLength(1, 0.001, 1e8, 100)
    const stiff = stretchedLength(1, 0.001, 1e9, 100)
    expect(stiff - 1).toBeLessThan(soft - 1)
  })

  it('rejects non-positive natural length, area or modulus, or negative force', () => {
    expect(() => stretchedLength(0, 0.001, 1e9, 10)).toThrow()
    expect(() => stretchedLength(1, 0, 1e9, 10)).toThrow()
    expect(() => stretchedLength(1, 0.001, 0, 10)).toThrow()
    expect(() => stretchedLength(1, 0.001, 1e9, -1)).toThrow()
  })
})

describe('withinElasticLimit', () => {
  it('is true at or below the limit, false above it', () => {
    expect(withinElasticLimit(10, 10)).toBe(true)
    expect(withinElasticLimit(9, 10)).toBe(true)
    expect(withinElasticLimit(11, 10)).toBe(false)
  })

  it('rejects a non-positive elastic limit', () => {
    expect(() => withinElasticLimit(1, 0)).toThrow()
  })
})

describe('RUBBER_BAND_DATA / nearestReading — সৃজনশীল প্রশ্ন ২, p. 157', () => {
  it('has 8 printed readings, starting and ending as printed', () => {
    expect(RUBBER_BAND_DATA.length).toBe(8)
    expect(RUBBER_BAND_DATA[0]).toEqual({ massKg: 0, loadedLengthCm: 10, relaxedLengthCm: 10 })
    expect(RUBBER_BAND_DATA[7]).toEqual({ massKg: 5, loadedLengthCm: 36, relaxedLengthCm: 10.6 })
  })

  it('relaxed length is exactly 10 cm through 3 kg — within the elastic limit', () => {
    for (const reading of RUBBER_BAND_DATA.filter((r) => r.massKg <= 3)) {
      expect(reading.relaxedLengthCm).toBe(10)
    }
  })

  it('relaxed length departs from 10 cm past 3 kg — the elastic limit made visible in the data', () => {
    const past = RUBBER_BAND_DATA.filter((r) => r.massKg > 3)
    expect(past.every((r) => r.relaxedLengthCm > 10)).toBe(true)
  })

  it('nearestReading finds the printed point at or below a given mass', () => {
    expect(nearestReading(2.2).loadedLengthCm).toBe(21)
    expect(nearestReading(2.5).loadedLengthCm).toBe(21)
    expect(nearestReading(0).loadedLengthCm).toBe(10)
  })

  it('rejects a negative mass', () => {
    expect(() => nearestReading(-1)).toThrow()
  })
})
