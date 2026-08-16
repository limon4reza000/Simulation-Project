/**
 * The laws of reflection.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৮.২.১ প্রতিফলনের
 * সূত্র, pp. 215–216.
 *
 * The book states two laws (p. 215): (1) the incident ray, the normal at the
 * point of incidence, and the reflected ray all lie in the same plane; (2)
 * the angle of reflection equals the angle of incidence, both measured from
 * the normal. This module models the second law directly — the first is a
 * statement about planarity that a 2D renderer already satisfies by
 * construction, so there is nothing further to compute for it.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** θr = θi (p. 215) — the reflection law itself. */
export function angleOfReflection(angleOfIncidenceDeg: number): number {
  if (angleOfIncidenceDeg < 0 || angleOfIncidenceDeg > 90) {
    throw new Error('angle of incidence must be between 0 and 90 degrees')
  }
  return round(angleOfIncidenceDeg)
}

/**
 * The two mirrors at 60° worked example (p. 222): a ray striking the first
 * mirror at angle θ (from that mirror's own normal) is deflected by
 * (180 - 2θ) degrees at each bounce; with the mirrors themselves at angle
 * φ apart, the ray returns exactly antiparallel to its original direction
 * when θ = φ, the book's own printed case (60° incidence, 60° mirror angle).
 * This is the general geometric identity behind that specific example.
 */
export function returnsAntiparallel(incidenceDeg: number, mirrorAngleDeg: number): boolean {
  if (incidenceDeg < 0 || incidenceDeg > 90) {
    throw new Error('incidence angle must be between 0 and 90 degrees')
  }
  if (mirrorAngleDeg <= 0 || mirrorAngleDeg > 180) {
    throw new Error('mirror angle must be between 0 and 180 degrees')
  }
  return Math.abs(incidenceDeg - mirrorAngleDeg) < 1e-6
}
