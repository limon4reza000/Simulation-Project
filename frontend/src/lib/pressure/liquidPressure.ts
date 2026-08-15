/**
 * Pressure inside a liquid: P = hρg.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৫.৩ তরলের ভেতর চাপ
 * (Pressure in Liquids), pp. 134–136.
 *
 * The book derives P = hρg from first principles (p. 134): the weight of the
 * liquid column of height h and cross-section A above a point is
 * F = (Ahρ)g, so pressure at that point is F/A = hρg, independent of A. Its
 * own worked examples (p. 136) span a whale diving to 2100 m (210 atm), a
 * diver reaching 305 m (30.5 atm), and three named liquids (kerosene, water,
 * mercury) compared at the same 0.5 m depth.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against those worked examples.
 */

const G = 9.8
const ATM_PA = 101325

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** P = hρg (p. 134). */
export function liquidPressure(depthM: number, densityKgM3: number, g = G): number {
  if (depthM < 0) throw new Error('depth must be non-negative')
  if (densityKgM3 <= 0) throw new Error('density must be positive')
  return round(depthM * densityKgM3 * g)
}

/**
 * The book's own simplified rule of thumb for water (p. 135–136): every 10 m
 * of depth adds roughly one atmosphere of pressure. Used directly in both the
 * whale and diver worked examples.
 */
export function atmospheresFromDepth(depthM: number, metresPerAtm = 10): number {
  if (depthM < 0) throw new Error('depth must be non-negative')
  if (metresPerAtm <= 0) throw new Error('metresPerAtm must be positive')
  return round(depthM / metresPerAtm)
}

/**
 * Depth at which a liquid of the given density reaches exactly 1 atm of
 * pressure (p. 136) — mercury's own 76 cm is the reference the book scales
 * every other liquid against.
 */
export function depthForOneAtm(densityKgM3: number, g = G): number {
  if (densityKgM3 <= 0) throw new Error('density must be positive')
  return round(ATM_PA / (densityKgM3 * g))
}
