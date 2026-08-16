/**
 * Total internal reflection and the critical angle.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৯.২ পূর্ণ
 * অভ্যন্তরীণ প্রতিফলন, pp. 248–251.
 *
 * The book derives the critical angle from Snell's law itself (p. 249):
 * going from a denser medium (n₁) toward a less dense one (n₂), θ₂ grows
 * faster than θ₁; the critical angle θc is the θ₁ at which θ₂ reaches
 * exactly 90°, giving sin θc = n₁/n₂. Past that angle no refraction is
 * geometrically possible at all — Snell's law would demand sin θ₂ > 1 — so
 * all the light reflects internally instead. The optical-fibre worked
 * example (p. 253) applies exactly this at a core/clad boundary.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * θc = asin(nLight/nDense) (p. 249): nDense is the medium the ray is
 * currently travelling in (must be the denser one), nLight is the medium on
 * the far side of the boundary it is trying to enter (must be less dense) —
 * the book's own n₂ and n₁ respectively in its "ঘন মাধ্যম (n₂) থেকে হালকা
 * মাধ্যমের (n₁) দিকে" setup (p. 248).
 */
export function criticalAngle(nDense: number, nLight: number): number {
  if (nDense <= 0 || nLight <= 0) throw new Error('refractive indices must be positive')
  if (nDense <= nLight) {
    throw new Error('total internal reflection requires leaving a denser medium (nDense > nLight)')
  }
  return round((Math.asin(nLight / nDense) * 180) / Math.PI)
}

/** Whether a ray at the given incidence angle undergoes total internal reflection. */
export function isTotalInternalReflection(
  nDense: number,
  nLight: number,
  incidenceDeg: number,
): boolean {
  if (incidenceDeg < 0 || incidenceDeg > 90) {
    throw new Error('incidence angle must be between 0 and 90 degrees')
  }
  if (nDense <= nLight) return false
  return incidenceDeg > criticalAngle(nDense, nLight)
}
