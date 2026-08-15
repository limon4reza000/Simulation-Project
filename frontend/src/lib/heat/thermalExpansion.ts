/**
 * Thermal expansion of solids: linear, area and volume.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৬.৩.১ কঠিন
 * পদার্থের প্রসারণ, pp. 166–171.
 *
 * The book defines the linear expansion coefficient from a length change
 * (p. 168): α = (L₂−L₁)/(L₁(T₂−T₁)), so L₂ = L₁ + αL₁(T₂−T₁). It then derives
 * — by squaring and cubing that same relation and discarding the α² and α³
 * terms as negligible, since α itself is of order 10⁻⁵ (pp. 169–170) — that
 * area expansion coefficient β = 2α and volume expansion coefficient γ = 3α.
 * Both worked examples (copper rod, p. 169; gold density, p. 171) are
 * reproduced exactly by this module.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** α = (L2-L1)/(L1(T2-T1)) (p. 168), solved from a measured length change. */
export function linearExpansionCoefficient(
  length1M: number,
  length2M: number,
  temp1C: number,
  temp2C: number,
): number {
  if (length1M <= 0) throw new Error('initial length must be positive')
  if (temp2C === temp1C) throw new Error('temperatures must differ')
  return round((length2M - length1M) / (length1M * (temp2C - temp1C)), 10)
}

/** L2 = L1 + αL1(T2-T1) (p. 168), the coefficient rearranged to predict length. */
export function expandedLength(
  length1M: number,
  alphaPerC: number,
  temp1C: number,
  temp2C: number,
): number {
  if (length1M <= 0) throw new Error('initial length must be positive')
  return round(length1M + alphaPerC * length1M * (temp2C - temp1C))
}

/** β = 2α — the book's own derived relation (p. 170). */
export function areaExpansionCoefficient(alphaPerC: number): number {
  return round(2 * alphaPerC, 10)
}

/** γ = 3α — the book's own derived relation (p. 170). */
export function volumeExpansionCoefficient(alphaPerC: number): number {
  return round(3 * alphaPerC, 10)
}

/**
 * New density after heating by ΔT, from ρ' = ρ/(1 + γΔT) (p. 171): mass is
 * unchanged by heating, so a larger volume gives a proportionally smaller
 * density. Reproduces the book's own gold worked example.
 */
export function expandedDensity(
  density1KgM3: number,
  alphaPerC: number,
  temp1C: number,
  temp2C: number,
): number {
  if (density1KgM3 <= 0) throw new Error('initial density must be positive')
  const gamma = volumeExpansionCoefficient(alphaPerC)
  return round(density1KgM3 / (1 + gamma * (temp2C - temp1C)))
}
