/**
 * Simple harmonic motion: the period of a pendulum and of a spring-mass system.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৭.১ সরল স্পন্দন গতি,
 * pp. 188–189.
 *
 * The book states both periods directly (p. 188): a mass m on a spring of
 * constant k has period T = 2π√(m/k); a pendulum of length l has period
 * T = 2π√(l/g) — and calls out explicitly, in parentheses, that this is not
 * a misprint: the period does not depend on the bob's mass at all, whether
 * light or heavy (p. 189). Its own worked example (a 1 m string, a 10 g
 * stone) gives T = 2.0 s.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

const G = 9.8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** T = 2π√(l/g) (p. 188) — independent of the bob's mass, as the book states explicitly. */
export function pendulumPeriod(lengthM: number, g = G): number {
  if (lengthM <= 0) throw new Error('length must be positive')
  return round(2 * Math.PI * Math.sqrt(lengthM / g))
}

/** T = 2π√(m/k) (p. 188), the analogous spring-mass period. */
export function springPeriod(massKg: number, springConstant: number): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  if (springConstant <= 0) throw new Error('spring constant must be positive')
  return round(2 * Math.PI * Math.sqrt(massKg / springConstant))
}

/** f = 1/T, the frequency corresponding to a pendulum of the given length. */
export function pendulumFrequency(lengthM: number, g = G): number {
  return round(1 / pendulumPeriod(lengthM, g))
}
