/**
 * Echo: the minimum distance for a reflected sound to be heard as distinct
 * from the original.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৭.৩.১ প্রতিধ্বনি,
 * pp. 201–202.
 *
 * The book's own reasoning (p. 201): the human ear keeps a sound "in mind"
 * for about 0.1 s, so two sounds are heard as separate only if they arrive
 * at least 0.1 s apart. A reflected sound travels to the wall and back — a
 * round trip of 2d for a wall at distance d — so the minimum distance for a
 * distinguishable echo is the one where that round trip takes exactly 0.1 s:
 * d = v(0.1)/2. At the book's own 330 m/s that is 16.5 m, exactly the
 * printed worked example.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

const MIN_DISTINGUISHABLE_S = 0.1

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** Round-trip time for sound to travel to a reflector at distanceM and back. */
export function roundTripTime(distanceM: number, speedMs: number): number {
  if (distanceM <= 0) throw new Error('distance must be positive')
  if (speedMs <= 0) throw new Error('speed must be positive')
  return round((2 * distanceM) / speedMs)
}

/** d = v(0.1)/2 (p. 201) — the minimum reflector distance for a distinguishable echo. */
export function minimumEchoDistance(speedMs: number, minGapS = MIN_DISTINGUISHABLE_S): number {
  if (speedMs <= 0) throw new Error('speed must be positive')
  if (minGapS <= 0) throw new Error('minimum gap must be positive')
  return round((speedMs * minGapS) / 2)
}

/** Whether a reflector at distanceM produces a distinguishable echo at the given sound speed. */
export function isEchoAudible(
  distanceM: number,
  speedMs: number,
  minGapS = MIN_DISTINGUISHABLE_S,
): boolean {
  return roundTripTime(distanceM, speedMs) >= minGapS
}
