/**
 * Resistance of a wire from its material, length and cross-section.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১১.২.২ রোধ,
 * pp. 306–309.
 *
 * The book states resistance is directly proportional to length (a longer
 * path is more obstructed) and inversely proportional to cross-sectional
 * area (a wider path is easier), combined via a material-specific constant
 * ρ, the resistivity (p. 306): R = ρL/A. টেবিল ১১.০১ (p. 307) prints ρ for
 * six named materials. Its own worked example (pp. 308–309) finds the wire
 * length needed for exactly 1 Ω, first at an unrealistic 1 m² cross-section,
 * then again at a realistic 0.1 mm radius — the book's own point that a
 * 1 m²-thick wire would need to be many kilometres long, while a hair-thin
 * wire needs only centimetres to metres.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against that worked example.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export interface Material {
  key: string
  labelBn: string
  labelEn: string
  /** Ω·m, from টেবিল ১১.০১, p. 307. */
  resistivity: number
}

/** টেবিল ১১.০১'s printed materials, in the book's own order. */
export const MATERIALS: readonly Material[] = [
  { key: 'silver', labelBn: 'রুপা', labelEn: 'Silver', resistivity: 1.59e-8 },
  { key: 'copper', labelBn: 'তামা', labelEn: 'Copper', resistivity: 1.68e-8 },
  { key: 'gold', labelBn: 'সোনা', labelEn: 'Gold', resistivity: 2.44e-8 },
  { key: 'tungsten', labelBn: 'টাংস্টেন', labelEn: 'Tungsten', resistivity: 5.5e-8 },
  { key: 'nichrome', labelBn: 'নাইক্রোম', labelEn: 'Nichrome', resistivity: 100e-8 },
]

/** A = πr² (p. 309), the cross-sectional area of a wire of radius r. */
export function circularArea(radiusM: number): number {
  if (radiusM <= 0) throw new Error('radius must be positive')
  return round(Math.PI * radiusM * radiusM, 12)
}

/** R = ρL/A (p. 306). */
export function wireResistance(resistivity: number, lengthM: number, areaM2: number): number {
  if (resistivity <= 0) throw new Error('resistivity must be positive')
  if (lengthM <= 0) throw new Error('length must be positive')
  if (areaM2 <= 0) throw new Error('area must be positive')
  return round((resistivity * lengthM) / areaM2)
}

/** L = RA/ρ (p. 308), the relation solved for length — the book's own worked direction. */
export function lengthForResistance(
  resistivity: number,
  targetOhm: number,
  areaM2: number,
): number {
  if (resistivity <= 0) throw new Error('resistivity must be positive')
  if (targetOhm <= 0) throw new Error('target resistance must be positive')
  if (areaM2 <= 0) throw new Error('area must be positive')
  return round((targetOhm * areaM2) / resistivity)
}

/** σ = 1/ρ (p. 307), conductivity — the reciprocal of resistivity. */
export function conductivity(resistivity: number): number {
  if (resistivity <= 0) throw new Error('resistivity must be positive')
  return round(1 / resistivity, 6)
}
