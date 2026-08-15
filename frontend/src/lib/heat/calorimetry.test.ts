import { describe, it, expect } from 'vitest'
import { finalTemperature, finalTemperatureWithMeltingIce, heatExchanged } from './calorimetry'

describe('finalTemperature — p. 179, m1s1(T1-T) = m2s2(T-T2)', () => {
  it('reproduces the book\'s own worked example: 2 L water at 75°C + 1 L at 20°C', () => {
    // Same specific heat throughout (both water), so it cancels — the
    // mathematically exact answer is 170/3 = 56.667°C; the book's own
    // printed answer (56.6°C) is a truncation of this, not a rounding.
    const t = finalTemperature(
      { massKg: 2, specificHeatJKgK: 4200, tempC: 75 },
      { massKg: 1, specificHeatJKgK: 4200, tempC: 20 },
    )
    expect(t).toBeCloseTo(56.667, 2)
  })

  it('reproduces the book\'s own worked example exactly: 10 g iron at 120°C dropped into 1 kg water at 30°C', () => {
    const t = finalTemperature(
      { massKg: 0.01, specificHeatJKgK: 450, tempC: 120 },
      { massKg: 1, specificHeatJKgK: 4200, tempC: 30 },
    )
    expect(t).toBeCloseTo(30.1, 1)
  })

  it('the final temperature always lies between the two starting temperatures', () => {
    const t = finalTemperature(
      { massKg: 3, specificHeatJKgK: 900, tempC: 10 },
      { massKg: 1, specificHeatJKgK: 4200, tempC: 90 },
    )
    expect(t).toBeGreaterThan(10)
    expect(t).toBeLessThan(90)
  })

  it('a much larger mass at one temperature dominates the result, as the book\'s own iron example illustrates', () => {
    const t = finalTemperature(
      { massKg: 0.01, specificHeatJKgK: 450, tempC: 120 },
      { massKg: 1, specificHeatJKgK: 4200, tempC: 30 },
    )
    // The tiny hot mass barely nudges the large cool mass.
    expect(t - 30).toBeLessThan(1)
  })

  it('rejects non-positive mass or specific heat', () => {
    expect(() =>
      finalTemperature(
        { massKg: 0, specificHeatJKgK: 4200, tempC: 10 },
        { massKg: 1, specificHeatJKgK: 4200, tempC: 90 },
      ),
    ).toThrow()
    expect(() =>
      finalTemperature(
        { massKg: 1, specificHeatJKgK: 0, tempC: 10 },
        { massKg: 1, specificHeatJKgK: 4200, tempC: 90 },
      ),
    ).toThrow()
  })
})

describe('finalTemperatureWithMeltingIce — p. 180, ice melting in warm water', () => {
  it('reproduces the book\'s own worked example: 100 g ice + 1 L water at 30°C → 20°C', () => {
    const t = finalTemperatureWithMeltingIce(0.1, 1, 30, 334000, 4200)
    expect(t).toBeCloseTo(20, 1)
  })

  it('rejects water starting at or below 0°C', () => {
    expect(() => finalTemperatureWithMeltingIce(0.1, 1, 0, 334000, 4200)).toThrow()
  })

  it('rejects a case with too little heat to fully melt the ice', () => {
    // A large mass of ice dropped into a tiny amount of barely-warm water.
    expect(() => finalTemperatureWithMeltingIce(5, 0.01, 1, 334000, 4200)).toThrow()
  })

  it('rejects non-positive masses', () => {
    expect(() => finalTemperatureWithMeltingIce(0, 1, 30, 334000, 4200)).toThrow()
  })
})

describe('heatExchanged', () => {
  it('is positive when the body warms up', () => {
    expect(heatExchanged({ massKg: 1, specificHeatJKgK: 4200, tempC: 20 }, 30)).toBeGreaterThan(0)
  })

  it('is negative when the body cools down', () => {
    expect(heatExchanged({ massKg: 1, specificHeatJKgK: 4200, tempC: 80 }, 30)).toBeLessThan(0)
  })

  it('matches Q = ms(deltaT) exactly', () => {
    expect(heatExchanged({ massKg: 2, specificHeatJKgK: 4200, tempC: 10 }, 30)).toBe(2 * 4200 * 20)
  })

  it('rejects non-positive mass or specific heat', () => {
    expect(() => heatExchanged({ massKg: 0, specificHeatJKgK: 4200, tempC: 10 }, 30)).toThrow()
    expect(() => heatExchanged({ massKg: 1, specificHeatJKgK: 0, tempC: 10 }, 30)).toThrow()
  })
})
