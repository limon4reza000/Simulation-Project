/**
 * Power of a lens.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৯.৪.৩ লেন্সের
 * ক্ষমতা, pp. 264–265.
 *
 * The book defines a lens's power as the reciprocal of its focal length in
 * metres, in diopters (p. 265): P = 1/f. It also states the sign convention
 * directly — positive ("পজিটিভ") for a convex lens, negative ("নেগেটিভ") for
 * a concave one — the same convention already used for signed focal length
 * in lensImage.ts. A shorter focal length means a more powerful lens (bends
 * light more sharply), which the book calls out explicitly with চিত্র ৯.২৭.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own worked example (2.5 D → 0.4 m).
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** P = 1/f (p. 265), f in metres, P in diopters. Sign follows f: positive convex, negative concave. */
export function lensPower(focalLengthM: number): number {
  if (focalLengthM === 0) throw new Error('focal length must not be zero')
  return round(1 / focalLengthM)
}

/** f = 1/P, the definition run in reverse (p. 265). */
export function focalLengthFromPower(powerDiopters: number): number {
  if (powerDiopters === 0) throw new Error('power must not be zero')
  return round(1 / powerDiopters)
}
