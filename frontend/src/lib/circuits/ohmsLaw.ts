/**
 * Ohm's law.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১১.২.১ ও'মের সূত্র,
 * pp. 304–305.
 *
 * The book reaches I = V/R experimentally (p. 304): plotting current against
 * potential difference for a fixed conductor gives a straight line through
 * the origin, I ∝ V, and the constant of proportionality — the conductor's
 * own resistance — is folded in to give the law its usual form. A resistor
 * of 1 Ω is defined directly from this (p. 305): 1 V across it drives
 * exactly 1 A through it.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** I = V/R (p. 305). */
export function current(voltageV: number, resistanceOhm: number): number {
  if (resistanceOhm <= 0) throw new Error('resistance must be positive')
  return round(voltageV / resistanceOhm)
}

/** V = IR, the law rearranged to solve for voltage. */
export function voltage(currentA: number, resistanceOhm: number): number {
  if (resistanceOhm <= 0) throw new Error('resistance must be positive')
  return round(currentA * resistanceOhm)
}

/** R = V/I, the law rearranged to solve for resistance — the book's own defining case (p. 305). */
export function resistanceFromOhmsLaw(voltageV: number, currentA: number): number {
  if (currentA <= 0) throw new Error('current must be positive')
  return round(voltageV / currentA)
}
