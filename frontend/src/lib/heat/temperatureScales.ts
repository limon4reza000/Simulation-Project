/**
 * Conversions between the Celsius, Kelvin and Fahrenheit temperature scales.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৬.২.১ ভিন্ন স্কেলের
 * মাঝে সম্পর্ক, pp. 165–167.
 *
 * The book derives all three relations from one printed identity (p. 165):
 *
 *     TC/100 = (TK - 273.15)/100 = (TF - 32)/180
 *
 * and works three of its own examples from it: the single temperature where
 * Celsius and Fahrenheit agree (−40°), the one where Kelvin and Fahrenheit
 * agree (574.59 K), and body temperature converted from 98.4°F to ≈36.89°C —
 * plus the explicit point (p. 166) that Celsius and Kelvin never agree at any
 * temperature, since they differ by a fixed additive constant rather than a
 * scale factor.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against those three worked examples.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** TK = TC + 273.15 (p. 166). */
export function celsiusToKelvin(celsius: number): number {
  return round(celsius + 273.15)
}

/** TC = TK - 273.15. */
export function kelvinToCelsius(kelvin: number): number {
  return round(kelvin - 273.15)
}

/** TF = (9/5)TC + 32, the book's own relation (p. 166) rearranged for TF. */
export function celsiusToFahrenheit(celsius: number): number {
  return round((9 / 5) * celsius + 32)
}

/** TC = (5/9)(TF - 32) (p. 166). */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return round((5 / 9) * (fahrenheit - 32))
}

export interface Temperature {
  celsius: number
  kelvin: number
  fahrenheit: number
}

/** All three readings for a given Celsius temperature, computed independently. */
export function fromCelsius(celsius: number): Temperature {
  return {
    celsius: round(celsius),
    kelvin: celsiusToKelvin(celsius),
    fahrenheit: celsiusToFahrenheit(celsius),
  }
}
