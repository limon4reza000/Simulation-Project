/**
 * Refraction: refractive index and Snell's law.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৯.১ আলোর প্রতিসরণ,
 * pp. 243–244, and §৯.১.১ প্রতিসরণের সূত্র, pp. 244–248.
 *
 * The book defines refractive index as n = c/v (p. 243) and states Snell's
 * law directly (p. 244): n₁ sin θ₁ = n₂ sin θ₂, where θ₁ and θ₂ are measured
 * from the normal in the first and second media respectively. Its own two
 * worked examples (pp. 245–246) run the law in both directions — solving
 * for θ₂ given both indices, and solving for n₂ given both angles.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

const C_MS = 3e8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** n = c/v (p. 243). */
export function refractiveIndex(speedMs: number, c = C_MS): number {
  if (speedMs <= 0 || speedMs > c) throw new Error('speed must be between 0 and c')
  return round(c / speedMs)
}

/** v = c/n, the definition run in reverse. */
export function speedInMedium(n: number, c = C_MS): number {
  if (n < 1) throw new Error('refractive index must be at least 1')
  return round(c / n)
}

/**
 * θ2 = asin((n1/n2) sin θ1) (p. 244, Snell's law solved for the refraction
 * angle). Throws if the geometry demands sin θ2 > 1 — physically, that means
 * no refraction occurs at all (total internal reflection instead), which is
 * exactly the boundary §৯.২ exists to explain.
 */
export function refractionAngle(n1: number, n2: number, angle1Deg: number): number {
  if (n1 <= 0 || n2 <= 0) throw new Error('refractive indices must be positive')
  if (angle1Deg < 0 || angle1Deg >= 90) throw new Error('angle of incidence must be between 0 and 90 degrees')
  const sin2 = (n1 / n2) * Math.sin((angle1Deg * Math.PI) / 180)
  if (sin2 > 1) throw new Error('no refraction is possible at this angle (total internal reflection)')
  return round((Math.asin(sin2) * 180) / Math.PI)
}

/** n2 = n1 sin θ1 / sin θ2 (p. 246), Snell's law solved for the unknown index. */
export function refractiveIndexFromAngles(
  n1: number,
  angle1Deg: number,
  angle2Deg: number,
): number {
  if (n1 <= 0) throw new Error('refractive index must be positive')
  if (angle1Deg <= 0 || angle1Deg >= 90) throw new Error('angle 1 must be between 0 and 90 degrees')
  if (angle2Deg <= 0 || angle2Deg >= 90) throw new Error('angle 2 must be between 0 and 90 degrees')
  const sin1 = Math.sin((angle1Deg * Math.PI) / 180)
  const sin2 = Math.sin((angle2Deg * Math.PI) / 180)
  return round((n1 * sin1) / sin2)
}
