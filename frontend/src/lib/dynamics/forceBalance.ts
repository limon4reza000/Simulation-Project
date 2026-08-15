/**
 * Resultant of several coplanar forces.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৩.৩ বলের
 * সাম্যাবস্থা ও অসাম্যাবস্থা (Balanced and Unbalanced Forces), pp. 69–70.
 *
 * The book's own definition (p. 69): "দুই বা তেতোধিক বল একটি বস্তুর উপর
 * প্রয়োগ করার পর বলগুলোর সম্মিলিত লব্ধি যদি শূন্য হয়, তাহলে বস্তুটির ত্বরণ
 * থাকে না" (if the combined resultant of two or more forces on a body is
 * zero, the body has no acceleration) — i.e. balanced forces, §৩.৩'s
 * equilibrium condition. Its own worked figures are qualitative (a pendulum,
 * a book held by two hands, চিত্র ৩.০২–৩.০৩) rather than numeric, so this
 * module is general vector addition rather than a fit to one page's numbers;
 * the tests check the vector algebra itself.
 *
 * No React — pure vector arithmetic, reused by the renderer and testable.
 */

export interface Vector {
  /** Magnitude, newtons. */
  magnitude: number
  /** Direction, degrees, 0 = along +x, counter-clockwise positive. */
  angleDeg: number
}

export interface Cartesian {
  x: number
  y: number
}

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export function toCartesian(v: Vector): Cartesian {
  const rad = (v.angleDeg * Math.PI) / 180
  return { x: round(v.magnitude * Math.cos(rad)), y: round(v.magnitude * Math.sin(rad)) }
}

export function toVector(c: Cartesian): Vector {
  const magnitude = round(Math.hypot(c.x, c.y))
  const angleDeg = magnitude === 0 ? 0 : round((Math.atan2(c.y, c.x) * 180) / Math.PI)
  return { magnitude, angleDeg }
}

/** Vector sum of any number of forces — the book's "সম্মিলিত লব্ধি". */
export function resultant(forces: Vector[]): Vector {
  const sum = forces.reduce(
    (acc, f) => {
      const c = toCartesian(f)
      return { x: acc.x + c.x, y: acc.y + c.y }
    },
    { x: 0, y: 0 },
  )
  return toVector(sum)
}

/**
 * Whether the forces balance — the book's equilibrium condition (p. 69):
 * resultant magnitude effectively zero. A small tolerance rather than exact
 * zero, since the forces a student drags in are read off a slider and will
 * essentially never sum to floating-point-exact zero even when the intent is
 * balance.
 */
export function isBalanced(forces: Vector[], tolerance = 0.05): boolean {
  return resultant(forces).magnitude <= tolerance
}

/**
 * The single force that would balance the given set — equal magnitude,
 * opposite direction to their resultant. This is what the book's tug-of-war
 * and hanging-book examples are: the resultant already existing, cancelled
 * by finding this equilibrant.
 */
export function equilibrant(forces: Vector[]): Vector {
  const r = resultant(forces)
  return { magnitude: r.magnitude, angleDeg: round(((r.angleDeg + 180) % 360 + 360) % 360) }
}
