import { describe, it, expect } from 'vitest'
import {
  celsiusToKelvin,
  kelvinToCelsius,
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  fromCelsius,
} from './temperatureScales'

describe('celsiusToKelvin / kelvinToCelsius — p. 166', () => {
  it('0°C is 273.15 K, the book\'s own reference point', () => {
    expect(celsiusToKelvin(0)).toBe(273.15)
  })

  it('round-trips exactly', () => {
    expect(kelvinToCelsius(celsiusToKelvin(37))).toBeCloseTo(37, 6)
  })

  it('the two scales never agree at any temperature', () => {
    // They differ by a fixed additive constant (273.15), never zero.
    for (const c of [-273.15, 0, 100, 574.59]) {
      expect(celsiusToKelvin(c)).not.toBeCloseTo(c, 6)
    }
  })
})

describe('celsiusToFahrenheit / fahrenheitToCelsius — p. 166', () => {
  it('reproduces the book\'s own worked example: -40°C = -40°F', () => {
    expect(celsiusToFahrenheit(-40)).toBe(-40)
    expect(fahrenheitToCelsius(-40)).toBe(-40)
  })

  it('reproduces the book\'s own worked example: 98.4°F is about 36.89°C', () => {
    expect(fahrenheitToCelsius(98.4)).toBeCloseTo(36.89, 2)
  })

  it('freezing and boiling points of water match the book\'s reference values', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
    expect(celsiusToFahrenheit(100)).toBe(212)
  })

  it('round-trips exactly', () => {
    expect(fahrenheitToCelsius(celsiusToFahrenheit(21))).toBeCloseTo(21, 6)
  })
})

describe('fromCelsius — all three readings at once', () => {
  it('reproduces the book\'s own worked example: TK = TF at 574.59 K', () => {
    // At 574.59 K (301.44°C), Kelvin and Fahrenheit numerically agree.
    const t = fromCelsius(301.44)
    expect(t.kelvin).toBeCloseTo(574.59, 1)
    expect(t.fahrenheit).toBeCloseTo(574.59, 0)
  })

  it('is internally consistent: converting kelvin back matches celsius', () => {
    const t = fromCelsius(25)
    expect(kelvinToCelsius(t.kelvin)).toBeCloseTo(t.celsius, 6)
  })
})
