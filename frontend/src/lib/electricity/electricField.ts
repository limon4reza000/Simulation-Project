/**
 * Electric field and electric potential of a point charge.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১০.৫ তড়িৎ ক্ষেত্র,
 * pp. 283–286, and §১০.৬ তড়িৎ বিভব, pp. 287–288.
 *
 * The book defines field the same way it defined gravitational field
 * earlier in the book (p. 283): factor Coulomb's law into F = qE, where
 * E = kq/r² is a property of the source charge alone, independent of
 * whatever test charge is placed there. Potential (p. 288) is derived
 * similarly by dividing the work needed to bring a unit test charge in from
 * infinity by that test charge: V(r) = kq/r — one power of r less than the
 * field, since potential is work per charge (scalar) while field is force
 * per charge (vector).
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own two field worked examples.
 */

const K = 9e9

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** E = kq/r² (p. 283-284). */
export function electricField(q: number, r: number, k = K): number {
  if (r <= 0) throw new Error('distance must be positive')
  return round((k * q) / (r * r), 4)
}

/** F = Eq (p. 284), the field definition run forward onto a placed test charge. */
export function forceOnCharge(fieldNC: number, q: number): number {
  return round(fieldNC * q, 6)
}

/** E = F/q (p. 286), the book's own worked direction: field recovered from a measured force. */
export function fieldFromForce(forceN: number, q: number): number {
  if (q === 0) throw new Error('charge must not be zero')
  return round(forceN / q, 4)
}

/** V(r) = kq/r (p. 288). */
export function electricPotential(q: number, r: number, k = K): number {
  if (r <= 0) throw new Error('distance must be positive')
  return round((k * q) / r, 4)
}
