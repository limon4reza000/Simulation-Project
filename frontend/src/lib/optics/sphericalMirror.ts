/**
 * Image formation in a spherical (concave or convex) mirror.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৮.৪–৮.৬.১
 * গোলীয়/উত্তল/অবতল আয়না, pp. 223–233.
 *
 * The book derives f = r/2 for both mirror types by the same near-axis
 * geometric argument (pp. 224–225, 228–229), states the convex mirror's
 * image is always virtual, erect and diminished regardless of object
 * position (p. 226), and for the concave mirror prints the full seven-row
 * table of image position/nature by object position relative to F and the
 * centre of curvature C (p. 232) — object at infinity, beyond C, at C,
 * between C and F, at F, between F and P, and at P.
 *
 * This module encodes the focal length as signed — positive for a concave
 * mirror (a real focus in front of the mirror), negative for a convex one
 * (a virtual focus behind it) — and solves the mirror formula in that
 * convention; every row of the book's own table falls out of the sign of
 * the resulting image distance, rather than needing to be special-cased.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against every row of that table.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export type MirrorType = 'concave' | 'convex'

/** f = r/2 (pp. 225, 229), signed by mirror type as this module's own convention. */
export function focalLength(radiusM: number, type: MirrorType): number {
  if (radiusM <= 0) throw new Error('radius must be positive')
  return type === 'concave' ? round(radiusM / 2) : round(-radiusM / 2)
}

export interface ImageResult {
  /** Signed: positive = real (in front of the mirror), negative = virtual (behind it). */
  imageDistance: number
  real: boolean
  /** For a single mirror, every real image is inverted and every virtual image is erect. */
  erect: boolean
  magnification: number
  sizeRelation: 'diminished' | 'same' | 'magnified'
}

/**
 * Solves 1/u + 1/v = 1/f (p. 233) for v, then classifies the result exactly
 * as টেবিল p. 232 does. u is the object distance (always a positive
 * magnitude — the object is always real). Object exactly at the focus
 * (u === f, concave only) throws: the book states no image forms there at
 * all (rays leave parallel and never meet).
 */
export function imageFromMirrorFormula(objectDistanceM: number, focalLengthM: number): ImageResult {
  if (objectDistanceM <= 0) throw new Error('object distance must be positive')
  if (focalLengthM === 0) throw new Error('focal length must not be zero')
  if (Math.abs(objectDistanceM - focalLengthM) < 1e-9 && focalLengthM > 0) {
    throw new Error('no image forms with the object exactly at a concave mirror\'s focus')
  }
  const v = 1 / (1 / focalLengthM - 1 / objectDistanceM)
  const real = v > 0
  const magnitude = round(Math.abs(v) / objectDistanceM)
  const sizeRelation: ImageResult['sizeRelation'] =
    magnitude > 1.000001 ? 'magnified' : magnitude < 0.999999 ? 'diminished' : 'same'
  return {
    imageDistance: round(v),
    real,
    erect: !real,
    magnification: magnitude,
    sizeRelation,
  }
}
