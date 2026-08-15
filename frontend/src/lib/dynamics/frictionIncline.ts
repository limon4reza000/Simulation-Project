/**
 * Static and kinetic friction on an incline.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৩.৯.১ ঘর্ষণের
 * প্রকারভেদ and চিত্র ৩.১৮, pp. 89–91.
 *
 * The book's own investigation (চিত্র ৩.১৮, p. 91): tilt a book with a
 * matchbox on top until the matchbox just starts to slide, at critical angle
 * θc. At that exact angle, gravity's component along the slope equals the
 * maximum static friction:
 *
 *     mg sin θc = μs · mg cos θc   =>   μs = tan θc
 *
 * — printed in the book as a bare assertion ("স্থিতি ঘর্ষণ সহগ μs এর মান হবে
 * tan θ") with no worked numeric example, unlike most of this chapter's other
 * sections. The tests below therefore check the *identity* itself and general
 * physical behaviour (nothing slides on a flat surface, everything eventually
 * slides as the angle approaches vertical), not a page-printed figure that
 * does not exist — the same honesty policy used for Chapter 2's own
 * un-worked investigation (see inclinedPlane.ts).
 *
 * Static/kinetic friction formulas fs = μs·N, fk = μk·N are also printed
 * (pp. 89–90) and used directly below.
 *
 * No React — pure physics, reused by the renderer and directly testable.
 */

export const G = 9.8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** μs = tan θc — the book's own result, read directly off the critical angle. */
export function staticCoefficientFromAngle(criticalAngleRad: number): number {
  if (criticalAngleRad < 0 || criticalAngleRad >= Math.PI / 2) {
    throw new Error('angle must be between 0 and 90 degrees')
  }
  return round(Math.tan(criticalAngleRad))
}

/**
 * The inverse: the angle at which a given μs makes a block just start to
 * slide. Deliberately NOT rounded, unlike most values this module returns:
 * `staysStill` compares `tan(angleRad) <= staticCoefficient` at exactly this
 * boundary, and rounding the angle to 6 decimals here was enough error,
 * amplified by tan's derivative, to push a boundary case to the wrong side of
 * that comparison — the same class of bug fixed in collision.ts, where
 * rounding a value before feeding it into a downstream check corrupted the
 * check rather than the physics. Round only for display, in the renderer.
 */
export function criticalAngle(staticCoefficient: number): number {
  if (staticCoefficient < 0) throw new Error('coefficient must be non-negative')
  return Math.atan(staticCoefficient)
}

/**
 * Whether a block stays put at a given incline angle: true while gravity's
 * along-slope component does not exceed the maximum static friction available.
 */
export function staysStill(angleRad: number, staticCoefficient: number): boolean {
  return Math.tan(angleRad) <= staticCoefficient
}

/**
 * Acceleration once sliding, from Newton's second law resolved along the
 * slope: mg sin θ (driving) minus μk·mg cos θ (resisting), divided by mass —
 * the mg cancels, leaving acceleration independent of mass, as friction always
 * does when it is proportional to normal force on a simple incline.
 */
export function slideAcceleration(
  angleRad: number,
  kineticCoefficient: number,
  g: number = G,
): number {
  const a = g * (Math.sin(angleRad) - kineticCoefficient * Math.cos(angleRad))
  return round(Math.max(0, a))
}

/** Static friction force actually exerted (up to its maximum), fs ≤ μs·N. */
export function staticFrictionForce(
  massKg: number,
  angleRad: number,
  staticCoefficient: number,
  g: number = G,
): number {
  const driving = massKg * g * Math.sin(angleRad)
  const maxStatic = staticCoefficient * massKg * g * Math.cos(angleRad)
  // Static friction matches the driving force exactly, up to its ceiling —
  // it does not "push", so it is never more than what is needed to balance.
  return round(Math.min(driving, maxStatic))
}

/** Kinetic friction force, fk = μk·N. */
export function kineticFrictionForce(
  massKg: number,
  angleRad: number,
  kineticCoefficient: number,
  g: number = G,
): number {
  return round(kineticCoefficient * massKg * g * Math.cos(angleRad))
}
