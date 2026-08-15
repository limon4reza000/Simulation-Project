/**
 * Pressure: P = F/A.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৫.১ চাপ (Pressure),
 * pp. 129–130.
 *
 * The book is explicit (p. 130) that pressure, unlike force, is a scalar —
 * the same force spread over a larger area gives a smaller pressure, and its
 * own worked example (p. 130) is the reason lying flat is safer than
 * standing in quicksand: a 50 kg person's weight (490 N) spread over the
 * ~0.5 m² of their back gives 980 N/m², but the same weight on the ~0.03 m²
 * of their feet gives 16,333 N/m².
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against that worked example.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** P = F/A (p. 129). */
export function pressure(forceN: number, areaM2: number): number {
  if (areaM2 <= 0) throw new Error('area must be positive')
  return round(forceN / areaM2)
}

/** F = mg, the weight feeding into the pressure calculation. */
export function weightFromMass(massKg: number, g = 9.8): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  return round(massKg * g)
}
