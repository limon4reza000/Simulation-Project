import { describe, it, expect } from 'vitest'
import {
  frequency,
  waveSpeed,
  wavelengthFromSpeed,
  describeWave,
  relativeIntensity,
} from './waveProperties'

describe('frequency — f = 1/T, p. 195', () => {
  it('reproduces the book\'s own worked example: T = 0.2 s → f = 5 Hz', () => {
    expect(frequency(0.2)).toBe(5)
  })

  it('rejects a non-positive period', () => {
    expect(() => frequency(0)).toThrow()
  })
})

describe('waveSpeed — v = fλ, p. 195', () => {
  it('reproduces the book\'s own worked example: 5 Hz, 1 m → 5 m/s', () => {
    expect(waveSpeed(5, 1)).toBe(5)
  })

  it('rejects non-positive frequency or wavelength', () => {
    expect(() => waveSpeed(0, 1)).toThrow()
    expect(() => waveSpeed(5, 0)).toThrow()
  })
})

describe('wavelengthFromSpeed — p. 201, comparing a 1 kHz tone across media', () => {
  it('reproduces the book\'s own worked example: air, 334 m/s → 0.334 m', () => {
    expect(wavelengthFromSpeed(334, 1000)).toBeCloseTo(0.334, 3)
  })

  it('reproduces the book\'s own worked example: water, 1493 m/s → 1.49 m', () => {
    expect(wavelengthFromSpeed(1493, 1000)).toBeCloseTo(1.493, 2)
  })

  it('reproduces the book\'s own worked example: iron, 5130 m/s → 5.13 m', () => {
    expect(wavelengthFromSpeed(5130, 1000)).toBeCloseTo(5.13, 2)
  })

  it('is the inverse of waveSpeed', () => {
    expect(wavelengthFromSpeed(waveSpeed(5, 1), 5)).toBeCloseTo(1, 6)
  })
})

describe('describeWave — combining a full snapshot, চিত্র ৭.০৬-৭.০৮', () => {
  it('reproduces the book\'s own combined worked example exactly', () => {
    const w = describeWave({ amplitudeM: 0.1, wavelengthM: 1, periodS: 0.2 })
    expect(w.frequencyHz).toBe(5)
    expect(w.speedMs).toBe(5)
  })
})

describe('relativeIntensity — intensity ∝ amplitude², p. 190 & p. 200', () => {
  it('doubling amplitude quadruples relative intensity, as the book states', () => {
    expect(relativeIntensity(2, 1)).toBe(4)
  })

  it('is 1 at the reference amplitude', () => {
    expect(relativeIntensity(1, 1)).toBe(1)
  })

  it('is 0 at zero amplitude', () => {
    expect(relativeIntensity(0, 1)).toBe(0)
  })

  it('rejects a negative amplitude or non-positive reference', () => {
    expect(() => relativeIntensity(-1, 1)).toThrow()
    expect(() => relativeIntensity(1, 0)).toThrow()
  })
})
