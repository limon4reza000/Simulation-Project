/**
 * Image formation in a plane mirror.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৮.৩.১ প্রতিবিম্ব,
 * pp. 219–223.
 *
 * The book proves by triangle congruence (OPX ≅ OPX′, p. 219) that a plane
 * mirror's image sits exactly as far behind the mirror as the object is in
 * front of it, and states the four resulting properties directly (p. 220):
 * the image is (a) at equal distance, (b) virtual, (c) erect, and (d) the
 * same size as the object. Its own worked example (p. 221, চিত্র ৮.১২) shows
 * a striking consequence: a person of height h needs a mirror only h/2 tall
 * to see their entire reflection, and — the book calls this out explicitly
 * as the surprising part — that length does not depend on how far the
 * viewer stands from the mirror.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** Image distance behind the mirror equals object distance in front (p. 220). */
export function imageDistance(objectDistanceM: number): number {
  if (objectDistanceM <= 0) throw new Error('object distance must be positive')
  return round(objectDistanceM)
}

/**
 * Minimum plane-mirror length for a viewer of the given height to see their
 * whole reflection (p. 221) — exactly half their height, independent of how
 * far they stand from the mirror.
 */
export function minimumMirrorLength(viewerHeightM: number): number {
  if (viewerHeightM <= 0) throw new Error('viewer height must be positive')
  return round(viewerHeightM / 2)
}
