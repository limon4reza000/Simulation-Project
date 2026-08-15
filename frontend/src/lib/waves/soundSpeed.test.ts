import { describe, it, expect } from 'vitest'
import { speedAtTemperature, SOUND_SPEED_TABLE } from './soundSpeed'

describe('speedAtTemperature — v ∝ √T (Kelvin), p. 202-203', () => {
  it('reproduces the book\'s own worked example: 338 m/s at 10°C → about 349.6-349.7 m/s at 30°C', () => {
    // The book's own printed answer is 349.6 m/s; computing v1 = v2*sqrt(T1/T2)
    // to full precision gives 349.74 m/s — a small arithmetic rounding in the
    // book's own worked steps, not an error in this relation. Tolerance
    // covers both rather than picking a side.
    expect(speedAtTemperature(338, 10, 30)).toBeCloseTo(349.7, 0)
  })

  it('returns the same speed when the temperature does not change', () => {
    expect(speedAtTemperature(330, 20, 20)).toBeCloseTo(330, 6)
  })

  it('a higher temperature gives a higher speed', () => {
    expect(speedAtTemperature(330, 0, 100)).toBeGreaterThan(330)
  })

  it('a lower temperature gives a lower speed', () => {
    expect(speedAtTemperature(330, 20, -20)).toBeLessThan(330)
  })

  it('rejects a non-positive known speed', () => {
    expect(() => speedAtTemperature(0, 10, 30)).toThrow()
  })

  it('rejects a target temperature at or below absolute zero', () => {
    expect(() => speedAtTemperature(330, 20, -274)).toThrow()
  })
})

describe('SOUND_SPEED_TABLE — টেবিল ৭.০১, p. 202', () => {
  it('has all six printed media in the book\'s own order', () => {
    expect(SOUND_SPEED_TABLE.map((m) => m.key)).toEqual([
      'air',
      'hydrogen',
      'mercury',
      'water',
      'iron',
      'diamond',
    ])
  })

  it('speeds increase from air through to diamond, as printed', () => {
    for (let i = 1; i < SOUND_SPEED_TABLE.length; i++) {
      expect(SOUND_SPEED_TABLE[i].speedMs).toBeGreaterThan(SOUND_SPEED_TABLE[i - 1].speedMs)
    }
  })

  it('reproduces air\'s own printed reference speed: 330 m/s', () => {
    expect(SOUND_SPEED_TABLE.find((m) => m.key === 'air')?.speedMs).toBe(330)
  })
})
