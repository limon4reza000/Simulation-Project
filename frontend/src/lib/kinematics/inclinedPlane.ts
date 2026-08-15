/**
 * Inclined-plane rolling: অনুসন্ধান ২.০১, ঢালু তলের উপর গড়াতে থাকা বস্তুর গড়
 * দ্রুতি বের করা (finding the average speed of an object rolling down an
 * incline).
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), pp. 54–56.
 *
 * The book's own procedure (কাজের ধারা, p. 55):
 *   1. measure ramp length L
 *   2. raise one end by height h, giving sin θ = h/L
 *   3–4. release a ball/marble/pencil from rest and time its roll
 *   5. repeat and average the time
 *   6. average speed = L / t
 *   7. repeat at a second, steeper incline
 *
 * Unlike the Chapter 1 caliper investigation, the book does not print a worked
 * numeric example for this one — it is a "do it yourself" (কাজের ধারা) with no
 * answer key. The tests below therefore check the model against the equations
 * of motion the book already establishes in §২.৭ (v = at, s = ½at²), not
 * against a page-printed number, and say so.
 *
 * The model idealises the ball as sliding rather than rolling — the book's own
 * procedure does not correct for rotational inertia either, and introducing it
 * would make the simulation contradict the printed method it is digitising.
 */

export const G = 9.8

function round(value: number, decimals = 4): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** sin θ from the ramp's height and length, as the book defines it (p. 55). */
export function sinTheta(heightM: number, lengthM: number): number {
  if (lengthM <= 0) throw new Error('length must be positive')
  if (heightM < 0 || heightM > lengthM) {
    throw new Error('height must be between 0 and length')
  }
  return round(heightM / lengthM)
}

/** Acceleration down a frictionless incline, a = g·sin θ. */
export function inclineAcceleration(
  heightM: number,
  lengthM: number,
  g: number = G,
): number {
  return round(g * sinTheta(heightM, lengthM))
}

/**
 * Time to roll the full length from rest, from L = ½at²:
 *   t = √(2L/a)
 */
export function timeToRoll(heightM: number, lengthM: number, g: number = G): number {
  const a = inclineAcceleration(heightM, lengthM, g)
  if (a <= 0) return Infinity // a flat "incline" never finishes rolling
  return round(Math.sqrt((2 * lengthM) / a))
}

/**
 * Speed at the foot of the incline, v = at — equivalently √(2aL).
 */
export function finalSpeed(heightM: number, lengthM: number, g: number = G): number {
  const a = inclineAcceleration(heightM, lengthM, g)
  const t = timeToRoll(heightM, lengthM, g)
  if (!Number.isFinite(t)) return 0
  return round(a * t)
}

/**
 * Average speed over the roll, as the book computes it (p. 55, step 6):
 *   average speed = L / t
 * Starting from rest under constant acceleration this equals v/2, and the two
 * routes are cross-checked in the test suite.
 */
export function averageSpeed(heightM: number, lengthM: number, g: number = G): number {
  const t = timeToRoll(heightM, lengthM, g)
  if (!Number.isFinite(t) || t === 0) return 0
  return round(lengthM / t)
}

export interface RollPoint {
  t: number
  /** Distance travelled down the slope, m. */
  distance: number
  /** Speed along the slope, m/s. */
  speed: number
}

/** Samples the roll at even time steps, for drawing the ball's motion. */
export function sampleRoll(
  heightM: number,
  lengthM: number,
  steps: number,
  g: number = G,
): RollPoint[] {
  if (steps <= 0) throw new Error('steps must be positive')
  const a = inclineAcceleration(heightM, lengthM, g)
  const total = timeToRoll(heightM, lengthM, g)
  if (!Number.isFinite(total)) return [{ t: 0, distance: 0, speed: 0 }]

  const points: RollPoint[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (total * i) / steps
    points.push({
      t: round(t),
      distance: round(0.5 * a * t * t),
      speed: round(a * t),
    })
  }
  return points
}

/** Fraction travelled down the ramp (0 at top, 1 at the bottom), for animation. */
export function rollFraction(
  t: number,
  heightM: number,
  lengthM: number,
  g: number = G,
): number {
  const total = timeToRoll(heightM, lengthM, g)
  if (!Number.isFinite(total) || total === 0) return 0
  return Math.min(1, Math.max(0, t / total))
}

export interface Trial {
  heightM: number
  lengthM: number
  sinTheta: number
  timeS: number
  averageSpeedMs: number
}

/** One row of the results table the book asks students to fill in. */
export function recordTrial(heightM: number, lengthM: number, g: number = G): Trial {
  return {
    heightM: round(heightM),
    lengthM: round(lengthM),
    sinTheta: sinTheta(heightM, lengthM),
    timeS: timeToRoll(heightM, lengthM, g),
    averageSpeedMs: averageSpeed(heightM, lengthM, g),
  }
}
