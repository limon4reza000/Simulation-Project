/**
 * Free-fall kinematics.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §২.৮
 * পড়ন্ত বস্তুর সূত্র (Laws of Falling Bodies), pp. 48–50.
 *
 * The book states Galileo's three laws and then gives the three equations that
 * express them (p. 49), with u = 0 for a body released from rest:
 *
 *     v = gt          (second law: v ∝ t)
 *     h = ½gt²        (third law: h ∝ t²)
 *     v² = 2gh
 *
 * The first law — equal fall time regardless of mass, absent air resistance —
 * is not a formula; it is asserted by these equations containing no mass term
 * at all. `timeToFall` reflects that directly: it does not take a mass
 * argument, because the book's model has none.
 *
 * No React here. Kept pure so the model can be tested against the book's own
 * printed figures and reused by both the animation and any future worked
 * example or auto-graded exercise.
 */

/** Standard value used throughout the chapter, m/s². */
export const G = 9.8

export interface FallState {
  /** Elapsed time since release, s. */
  t: number
  /** Instantaneous speed, v = gt, m/s. */
  velocity: number
  /** Distance fallen, h = ½gt², m. */
  distance: number
}

function round(value: number, decimals = 4): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** State of a body released from rest at time t, having fallen under g. */
export function stateAtTime(t: number, g: number = G): FallState {
  if (t < 0) throw new Error('t must be non-negative')
  return {
    t: round(t),
    velocity: round(g * t),
    distance: round(0.5 * g * t * t),
  }
}

/**
 * Time to fall a given height from rest, from h = ½gt² inverted:
 *   t = √(2h/g)
 */
export function timeToFall(height: number, g: number = G): number {
  if (height < 0) throw new Error('height must be non-negative')
  return round(Math.sqrt((2 * height) / g))
}

/** Impact speed from v² = 2gh, taking the positive root. */
export function impactSpeed(height: number, g: number = G): number {
  if (height < 0) throw new Error('height must be non-negative')
  return round(Math.sqrt(2 * g * height))
}

/**
 * Samples the fall at even time steps, for plotting v–t and h–t.
 *
 * Stops at the moment of impact rather than continuing past it, so a plotted
 * curve never shows a body falling through the ground.
 */
export function sampleFall(
  height: number,
  steps: number,
  g: number = G,
): FallState[] {
  if (steps <= 0) throw new Error('steps must be positive')
  const total = timeToFall(height, g)
  const points: FallState[] = []
  for (let i = 0; i <= steps; i++) {
    points.push(stateAtTime((total * i) / steps, g))
  }
  return points
}

/**
 * Position fraction (0 = release, 1 = ground) at time t, for driving the drop
 * animation. Clamped so a caller integrating slightly past impact does not
 * send the body below the ground.
 */
export function fallFraction(t: number, height: number, g: number = G): number {
  if (height <= 0) return 1
  const fallen = 0.5 * g * t * t
  return Math.min(1, Math.max(0, fallen / height))
}
