/**
 * A swinging pendulum's kinetic/potential energy exchange.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৪.৫.১ শক্তির নিত্যতা
 * (Conservation of Energy), p. 114–115, চিত্র ৪.০৪.
 *
 * The book's own figure shows a pendulum at eight labelled swing positions
 * (a–h) with a T (গতিশক্তি) and V (স্থিতিশক্তি) bar pair at each: T and V trade
 * off as the bob swings, but T + V is drawn the same height throughout —
 * that invariant, not the pendulum itself, is the entire point of the
 * figure. This module reproduces exactly that: a bob on a string of length L,
 * released from angle θ₀, its height and speed given by the pendulum's own
 * geometry and by energy conservation respectively.
 *
 * No React — pure physics, reused by the renderer and directly testable.
 */

const G = 9.8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * Height of the bob above its lowest point (θ = 0), at angle θ (radians)
 * from vertical, for a string of length L. Standard pendulum geometry:
 * h = L(1 - cos θ).
 */
export function heightAtAngle(lengthM: number, angleRad: number): number {
  if (lengthM <= 0) throw new Error('length must be positive')
  return round(lengthM * (1 - Math.cos(angleRad)))
}

export interface PendulumState {
  angleRad: number
  height: number
  speed: number
  kinetic: number
  potential: number
  total: number
}

/**
 * State of a pendulum bob of mass m, string length L, released from rest at
 * amplitude θ₀, when currently at angle θ (|θ| ≤ θ₀). Speed comes from energy
 * conservation — mgh₀ = mgh + ½mv² — exactly the accounting চিত্র ৪.০৪ draws
 * as bar heights: total energy (T + V) is the same at every position.
 */
export function stateAtAngle(
  massKg: number,
  lengthM: number,
  amplitudeRad: number,
  angleRad: number,
  g = G,
): PendulumState {
  if (massKg <= 0) throw new Error('mass must be positive')
  if (amplitudeRad <= 0) throw new Error('amplitude must be positive')
  if (Math.abs(angleRad) > amplitudeRad + 1e-9) {
    throw new Error('angle must not exceed the release amplitude')
  }
  const h0 = heightAtAngle(lengthM, amplitudeRad)
  const h = heightAtAngle(lengthM, angleRad)
  const speedSq = Math.max(0, 2 * g * (h0 - h))
  const speed = Math.sqrt(speedSq)
  const kinetic = round(0.5 * massKg * speedSq)
  const potential = round(massKg * g * h)
  return {
    angleRad: round(angleRad),
    height: h,
    speed: round(speed),
    kinetic,
    potential,
    total: round(kinetic + potential),
  }
}

/**
 * Samples the swing from -amplitude to +amplitude (a full half-swing), for
 * driving an animation or a T/V bar chart across several positions at once —
 * the book's own চিত্র ৪.০৪ shows eight.
 */
export function sampleSwing(
  massKg: number,
  lengthM: number,
  amplitudeRad: number,
  steps: number,
): PendulumState[] {
  if (steps <= 0) throw new Error('steps must be positive')
  const points: PendulumState[] = []
  for (let i = 0; i <= steps; i++) {
    const angle = -amplitudeRad + (2 * amplitudeRad * i) / steps
    points.push(stateAtAngle(massKg, lengthM, amplitudeRad, angle))
  }
  return points
}
