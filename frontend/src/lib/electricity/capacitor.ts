/**
 * Capacitors: charge, voltage, and stored energy.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১০.৭ ধারক,
 * pp. 289–290.
 *
 * The book defines capacitance the same way it defines specific heat
 * earlier in the book (p. 289): a system's own characteristic of how much
 * its "potential" rises for a given amount deposited into it — charge in,
 * voltage out, V = Q/C. Energy stored in a charged capacitor (p. 290) is
 * derived and simply stated as ½CV².
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own worked example (20 μF at 10 V → 1 mJ).
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** Q = CV (p. 289), charge stored at a given voltage. */
export function chargeStored(capacitanceF: number, voltageV: number): number {
  if (capacitanceF <= 0) throw new Error('capacitance must be positive')
  return round(capacitanceF * voltageV, 12)
}

/** V = Q/C (p. 289), the definition run in reverse. */
export function voltageFromCharge(chargeC: number, capacitanceF: number): number {
  if (capacitanceF <= 0) throw new Error('capacitance must be positive')
  return round(chargeC / capacitanceF, 6)
}

/** energy = ½CV² (p. 290). */
export function storedEnergy(capacitanceF: number, voltageV: number): number {
  if (capacitanceF <= 0) throw new Error('capacitance must be positive')
  return round(0.5 * capacitanceF * voltageV * voltageV, 9)
}
