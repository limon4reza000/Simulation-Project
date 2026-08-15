/**
 * Stress, strain, and Hooke's law within the elastic limit.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৫.৫ স্থিতিস্থাপকতা
 * (Elasticity), pp. 147–149.
 *
 * The book defines strain as (L − L₀)/L₀ (p. 148, unitless), stress as
 * force per area F/A = T/A (p. 148, pascals), and Hooke's law as their
 * proportionality within the elastic limit: T/A = Y(L − L₀)/L₀, where Y is
 * the material's own Young's modulus (p. 149). Past the elastic limit the
 * book is explicit (p. 147) that the material does not return to its
 * original length — a permanent deformation remains.
 *
 * §৫.৫'s own সৃজনশীল প্রশ্ন ২ (p. 157) prints a rubber band's own measured
 * data: length under load (L₂) and length after the load is removed (L₁),
 * across masses from 0 to 5 kg. L₁ stays exactly 10 cm (the natural length)
 * through 3 kg, then drifts to 10.2 cm and 10.6 cm at 4 kg and 5 kg — the
 * elastic limit made visible directly in the printed numbers rather than
 * only stated in words. This module models exactly that dataset.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against it.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** strain = (L − L₀)/L₀ (p. 148). Unitless, as the book states explicitly. */
export function strain(naturalLengthM: number, stretchedLengthM: number): number {
  if (naturalLengthM <= 0) throw new Error('natural length must be positive')
  if (stretchedLengthM < 0) throw new Error('stretched length must be non-negative')
  return round((stretchedLengthM - naturalLengthM) / naturalLengthM)
}

/** stress = F/A (p. 148), in pascals. */
export function stress(forceN: number, areaM2: number): number {
  if (areaM2 <= 0) throw new Error('area must be positive')
  return round(forceN / areaM2)
}

/**
 * Length under a hanging mass, within the elastic limit — T/A = Y(L−L₀)/L₀
 * rearranged to solve for L (p. 149). Beyond `elasticLimitN`, Hooke's law no
 * longer applies and this function does not attempt to model the (nonlinear,
 * unspecified) behaviour past it — callers should treat the elastic limit as
 * a hard boundary of validity, exactly as the book treats it as a boundary
 * of the material's own behaviour.
 */
export function stretchedLength(
  naturalLengthM: number,
  areaM2: number,
  youngsModulusPa: number,
  forceN: number,
): number {
  if (naturalLengthM <= 0) throw new Error('natural length must be positive')
  if (areaM2 <= 0) throw new Error('area must be positive')
  if (youngsModulusPa <= 0) throw new Error('Young\'s modulus must be positive')
  if (forceN < 0) throw new Error('force must be non-negative')
  const strainValue = forceN / (areaM2 * youngsModulusPa)
  return round(naturalLengthM * (1 + strainValue))
}

/** Whether a given load stays within the material's elastic limit. */
export function withinElasticLimit(forceN: number, elasticLimitN: number): boolean {
  if (elasticLimitN <= 0) throw new Error('elastic limit must be positive')
  return forceN <= elasticLimitN
}

/**
 * The book's own printed rubber-band dataset (সৃজনশীল প্রশ্ন ২, p. 157):
 * mass loaded (kg), length under load L₂ (cm), and the length the band
 * relaxes back to once the mass is removed, L₁ (cm) — 10 cm through 3 kg,
 * then 10.2 cm and 10.6 cm at 4 kg and 5 kg as the elastic limit is passed.
 */
export interface RubberBandReading {
  massKg: number
  loadedLengthCm: number
  relaxedLengthCm: number
}

export const RUBBER_BAND_DATA: readonly RubberBandReading[] = [
  { massKg: 0, loadedLengthCm: 10, relaxedLengthCm: 10 },
  { massKg: 0.4, loadedLengthCm: 12, relaxedLengthCm: 10 },
  { massKg: 1, loadedLengthCm: 15, relaxedLengthCm: 10 },
  { massKg: 1.4, loadedLengthCm: 17, relaxedLengthCm: 10 },
  { massKg: 2.2, loadedLengthCm: 21, relaxedLengthCm: 10 },
  { massKg: 3, loadedLengthCm: 25, relaxedLengthCm: 10 },
  { massKg: 4, loadedLengthCm: 30, relaxedLengthCm: 10.2 },
  { massKg: 5, loadedLengthCm: 36, relaxedLengthCm: 10.6 },
]

/** The nearest printed reading at or below the given mass — for driving a slider over real data. */
export function nearestReading(massKg: number): RubberBandReading {
  if (massKg < 0) throw new Error('mass must be non-negative')
  let best = RUBBER_BAND_DATA[0]
  for (const reading of RUBBER_BAND_DATA) {
    if (reading.massKg <= massKg) best = reading
  }
  return best
}
