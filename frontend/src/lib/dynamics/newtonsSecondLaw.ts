/**
 * Newton's second law: F = ma.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৩.৬ বস্তুর গতির
 * উপর বলের প্রভাব: নিউটনের দ্বিতীয় গতি সূত্র, pp. 75–76.
 *
 * The book derives the law from the rate of change of momentum (p. 76):
 *
 *     rate of change of momentum = (mv - mu) / t = m(v - u)/t = ma
 *     F = ma          (taking the proportionality constant as 1)
 *
 * and states it in words: "বস্তুর ভরবেগের পরিবর্তনের হার তার উপর প্রযুক্ত
 * বলের সমানুপাতিক" (the rate of change of a body's momentum is proportional
 * to the force applied to it). A constant force on a constant mass therefore
 * gives constant acceleration, and this module models exactly that — a block
 * on a frictionless surface under one constant applied force — reusing the
 * same constant-acceleration kinematics as `lib/kinematics/freeFall.ts`
 * (v = u + at, s = ut + ½at²) rather than reinventing it, since §৩.৬ builds
 * directly on §২.৭'s equations of motion.
 *
 * No React — pure physics, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** a = F/m, the book's law rearranged to solve for acceleration. */
export function acceleration(forceN: number, massKg: number): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  return round(forceN / massKg)
}

export interface MotionState {
  t: number
  velocity: number
  displacement: number
  /** m(v - u), the momentum change since t = 0 — the book's own definition of F. */
  momentumChange: number
}

/**
 * State of a body starting at rest under a constant force, at time t.
 * Starting from rest (u = 0) matches every worked example in §৩.৬; a general
 * initial velocity is not needed to demonstrate F = ma itself.
 */
export function stateAtTime(forceN: number, massKg: number, t: number): MotionState {
  if (t < 0) throw new Error('t must be non-negative')
  const a = acceleration(forceN, massKg)
  const v = a * t
  return {
    t: round(t),
    velocity: round(v),
    displacement: round(0.5 * a * t * t),
    momentumChange: round(massKg * v),
  }
}

/** Samples the motion at even time steps, for plotting v–t. */
export function sampleMotion(
  forceN: number,
  massKg: number,
  durationS: number,
  steps: number,
): MotionState[] {
  if (steps <= 0) throw new Error('steps must be positive')
  if (durationS < 0) throw new Error('duration must be non-negative')
  const points: MotionState[] = []
  for (let i = 0; i <= steps; i++) {
    points.push(stateAtTime(forceN, massKg, (durationS * i) / steps))
  }
  return points
}

/**
 * Force required to change a body's momentum by Δp over time t — the book's
 * own definition of F run in reverse (p. 76): F = Δp/t. Useful for checking
 * the relationship both ways, exactly as a student would be asked to.
 */
export function forceFromMomentumChange(momentumChange: number, timeS: number): number {
  if (timeS <= 0) throw new Error('time must be positive')
  return round(momentumChange / timeS)
}
