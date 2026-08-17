/**
 * Electric power and household electricity cost.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১১.৩ তড়িৎ ক্ষমতা,
 * pp. 317–319.
 *
 * The book derives P = W/t = VQ/t = VI directly from work and Ohm's law
 * (p. 317), then rewrites it two further ways using V = IR: P = I²R and
 * P = V²/R (p. 318). Its own worked example (p. 319) turns this into a
 * household electricity bill: energy in "units" (kilowatt-hours) is
 * (P × t)/1000 with P in watts and t in hours, priced per unit.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against that worked example.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** P = VI (p. 317). */
export function powerFromVI(voltageV: number, currentA: number): number {
  return round(voltageV * currentA)
}

/** P = I²R (p. 318). */
export function powerFromIR(currentA: number, resistanceOhm: number): number {
  if (resistanceOhm <= 0) throw new Error('resistance must be positive')
  return round(currentA * currentA * resistanceOhm)
}

/** P = V²/R (p. 318). */
export function powerFromVR(voltageV: number, resistanceOhm: number): number {
  if (resistanceOhm <= 0) throw new Error('resistance must be positive')
  return round((voltageV * voltageV) / resistanceOhm)
}

export interface ElectricityBill {
  units: number
  costTaka: number
}

/**
 * Energy used and its cost, exactly as the book's own worked example
 * computes it (p. 319): units (kWh) = (P_watts × t_hours) / 1000, then
 * priced per unit.
 */
export function electricityBill(
  powerW: number,
  hoursPerDay: number,
  days: number,
  taka_per_unit: number,
): ElectricityBill {
  if (powerW <= 0) throw new Error('power must be positive')
  if (hoursPerDay < 0 || days < 0) throw new Error('hours and days must be non-negative')
  if (taka_per_unit < 0) throw new Error('price per unit must be non-negative')
  const units = round((powerW * hoursPerDay * days) / 1000)
  return { units, costTaka: round(units * taka_per_unit) }
}
