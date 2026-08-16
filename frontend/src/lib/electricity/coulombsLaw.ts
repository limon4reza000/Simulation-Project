/**
 * Coulomb's law: the electric force between two point charges.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১০.৮ তড়িৎ বল,
 * pp. 279–282.
 *
 * The book builds Coulomb's law explicitly as the electrical analogue of
 * Newton's gravitation law (p. 279): swap masses m₁, m₂ for charges q₁, q₂
 * and the constant G for k = 9×10⁹ Nm²/C², and F = Gm₁m₂/r² becomes
 * F = kq₁q₂/r². Its sign carries meaning the same way (p. 281): like signs
 * give a positive F (repulsion), opposite signs give a negative F
 * (attraction) — the book calls this out as the same information gravity
 * never needed, since mass has no negative version.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against three of the book's own worked examples: the ±1 C pair, the
 * hydrogen-atom proton–electron pair, and the three-charge equilibrium
 * problem.
 */

const K = 9e9

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * F = kq1q2/r² (p. 280). Positive = repulsion, negative = attraction, exactly
 * as the book states. Deliberately not rounded: charges and forces in this
 * chapter's own worked examples span from ~1e-19 C / ~1e-12 N up to whole
 * coulombs / ~1e11 N, and a fixed-decimal-place round (the pattern used
 * elsewhere in this codebase) would zero out anything below its cutoff —
 * exactly wrong for a quantity that legitimately lives at 1e-12.
 */
export function coulombForce(q1: number, q2: number, r: number, k = K): number {
  if (r <= 0) throw new Error('separation must be positive')
  return (k * q1 * q2) / (r * r)
}

/**
 * The equilibrium point on the line between two like charges q1 and q2,
 * separation d apart, where a third charge feels zero net force — the
 * book's own worked example (p. 281): x measured from q1, solving
 * q1(d-x)² = q2 x² for the physically meaningful root between 0 and d.
 */
export function equilibriumPoint(q1: number, q2: number, d: number): number {
  if (q1 <= 0 || q2 <= 0) {
    throw new Error('this construction requires two like (same-sign) charges')
  }
  if (d <= 0) throw new Error('separation must be positive')
  // q1(d-x)^2 = q2 x^2  =>  sqrt(q1)(d-x) = sqrt(q2) x  =>  x = d*sqrt(q1)/(sqrt(q1)+sqrt(q2))
  const x = (d * Math.sqrt(q1)) / (Math.sqrt(q1) + Math.sqrt(q2))
  return round(x)
}
