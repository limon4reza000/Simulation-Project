/**
 * Work: W = Fs, and the book's treatment of its sign.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৪.১ কাজ (Work),
 * pp. 100–103.
 *
 * The book is explicit (p. 101) that work is a scalar — the product of a
 * force and the displacement *in the direction of that force* — and that its
 * sign carries real meaning (p. 103): work done by a force in the direction
 * of motion is positive, work done against the motion (like friction,
 * চিত্র ৪.০১) is negative. "নেগেটিভ কাজ" is not a null result; it is the book's
 * own vocabulary for a force taking energy away rather than giving it.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own two worked examples.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** W = Fs. Negative when the force opposes the displacement (e.g. friction). */
export function work(forceN: number, displacementM: number): number {
  return round(forceN * displacementM)
}

export interface WorkAgainstFriction {
  appliedWork: number
  frictionWork: number
  /** Net work done on the body — what actually changes its kinetic energy. */
  netWork: number
}

/**
 * The চিত্র ৪.০১ setup: a force F pulls a body distance d, opposed by a
 * friction force f. Both forces act over the same displacement, so both do
 * work over it — one positive, one negative (p. 103).
 */
export function workAgainstFriction(
  forceN: number,
  frictionN: number,
  displacementM: number,
): WorkAgainstFriction {
  if (frictionN < 0) throw new Error('friction must be non-negative')
  const appliedWork = work(forceN, displacementM)
  const frictionWork = work(-frictionN, displacementM)
  return {
    appliedWork,
    frictionWork,
    netWork: round(appliedWork + frictionWork),
  }
}

/**
 * Work done lifting a body of mass m through height h against gravity
 * (p. 101's climbing-stairs example): W = mgh, always positive since the
 * applied force and the displacement are both directed upward.
 */
export function workAgainstGravity(massKg: number, heightM: number, g = 9.8): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  if (heightM < 0) throw new Error('height must be non-negative')
  return round(massKg * g * heightM)
}
