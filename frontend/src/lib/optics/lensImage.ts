/**
 * Image formation in a thin lens (convex or concave).
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৯.৪.১ অবতল লেন্স,
 * pp. 257–259, and §৯.৪.২ উত্তল লেন্স, pp. 259–264.
 *
 * The book builds every result in these sections purely by ray construction
 * — three special rays (through the optical centre undeviated, parallel to
 * the axis bending through the focus, and through the focus emerging
 * parallel) — and states the outcomes directly: a concave lens always gives
 * a virtual, erect, diminished image regardless of object position
 * (pp. 257–259); a convex lens's image depends on where the object sits
 * relative to f and 2f, with five distinct cases worked through individually
 * (pp. 259–264): inside f (virtual, erect, magnified), at 2f (real,
 * inverted, same size), between f and 2f (real, inverted, magnified),
 * beyond 2f (real, inverted, diminished), and at f (no image forms).
 *
 * Notably, this chapter never states an algebraic lens formula analogous to
 * Chapter 8's mirror equation (1/u + 1/v = 1/f) — every one of the results
 * above is reached by ray construction alone. A thin lens's image equation
 * has the identical mathematical shape as a mirror's, though (1/v − 1/u =
 * 1/f in the standard sign convention), so this module reuses the same
 * signed-focal-length approach already proven against Chapter 8's full
 * seven-row mirror table in sphericalMirror.ts — every one of this
 * chapter's five cases is checked against it below.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export type LensType = 'convex' | 'concave'

export interface LensImageResult {
  /** Signed: positive = real (opposite side from the object), negative = virtual (same side). */
  imageDistance: number
  real: boolean
  /** For a single thin lens, every real image is inverted and every virtual image is erect. */
  erect: boolean
  magnification: number
  sizeRelation: 'diminished' | 'same' | 'magnified'
}

/**
 * Solves 1/v = 1/f - 1/u for a thin lens — algebraically identical in shape
 * to sphericalMirror.ts's mirror formula once f is signed the same way
 * (positive for convex, negative for concave), even though a lens's real
 * image forms on the opposite side from the object while a mirror's forms
 * on the same side; working through the book's own five cases below
 * confirms the shared formula reproduces every one of them. u is the
 * object distance, always a positive magnitude. Object exactly at a
 * convex lens's focus (u === f, f > 0) throws: no image forms there, per
 * the book's own statement (p. 264).
 */
export function lensImage(objectDistanceM: number, focalLengthM: number): LensImageResult {
  if (objectDistanceM <= 0) throw new Error('object distance must be positive')
  if (focalLengthM === 0) throw new Error('focal length must not be zero')
  if (Math.abs(objectDistanceM - focalLengthM) < 1e-9 && focalLengthM > 0) {
    throw new Error('no image forms with the object exactly at a convex lens\'s focus')
  }
  const v = 1 / (1 / focalLengthM - 1 / objectDistanceM)
  const real = v > 0
  const magnitude = round(Math.abs(v) / objectDistanceM)
  const sizeRelation: LensImageResult['sizeRelation'] =
    magnitude > 1.000001 ? 'magnified' : magnitude < 0.999999 ? 'diminished' : 'same'
  return {
    imageDistance: round(v),
    real,
    erect: !real,
    magnification: magnitude,
    sizeRelation,
  }
}

export function lensFocalLength(magnitudeM: number, type: LensType): number {
  if (magnitudeM <= 0) throw new Error('focal length magnitude must be positive')
  return type === 'convex' ? round(magnitudeM) : round(-magnitudeM)
}
