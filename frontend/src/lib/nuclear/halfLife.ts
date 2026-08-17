/**
 * Radioactive decay: half-life.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১৩.১.৪ অর্ধায়ু,
 * p. 352.
 *
 * The book defines half-life as the time it takes for half of a sample's
 * radioactive nuclei to decay, and its own worked example makes a point
 * worth preserving here: after two half-lives (200 years at a 100-year
 * half-life), only 1/4 of the original *nuclei* remain radioactive — but the
 * sample's total *mass* barely changes at all, because decay converts a
 * small fraction of nuclei into a different element, not the bulk of the
 * material into something else. This module models the fraction of
 * originally-radioactive nuclei remaining, N/N0 = (1/2)^(t/T), which is
 * exactly what "1/4 remains" refers to.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own worked example and its own sample-question fixture
 * (run in the opposite direction: given a remaining fraction and elapsed
 * time, solve for the half-life itself).
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** N/N0 = (1/2)^(t/T) (p. 352). */
export function remainingFraction(elapsedTime: number, halfLife: number): number {
  if (elapsedTime < 0) throw new Error('elapsed time must be non-negative')
  if (halfLife <= 0) throw new Error('half-life must be positive')
  return round(Math.pow(0.5, elapsedTime / halfLife))
}

/** N = N0 * (1/2)^(t/T), the fraction applied to an actual starting quantity. */
export function remainingAmount(initialAmount: number, elapsedTime: number, halfLife: number): number {
  if (initialAmount <= 0) throw new Error('initial amount must be positive')
  return round(initialAmount * remainingFraction(elapsedTime, halfLife))
}

/**
 * T solved from a measured remaining fraction after a known elapsed time —
 * the book's own sample-question direction (p. 360): 1 kg decays to 250 g
 * of the original isotope after 900 years, giving T = 450 years.
 */
export function halfLifeFromDecay(elapsedTime: number, remainingFrac: number): number {
  if (elapsedTime <= 0) throw new Error('elapsed time must be positive')
  if (remainingFrac <= 0 || remainingFrac >= 1) {
    throw new Error('remaining fraction must be strictly between 0 and 1')
  }
  return round(elapsedTime * (Math.LN2 / -Math.log(remainingFrac)))
}

/** Number of whole half-lives elapsed, for display (e.g. "2 half-lives have passed"). */
export function halfLivesElapsed(elapsedTime: number, halfLife: number): number {
  if (elapsedTime < 0) throw new Error('elapsed time must be non-negative')
  if (halfLife <= 0) throw new Error('half-life must be positive')
  return round(elapsedTime / halfLife)
}
