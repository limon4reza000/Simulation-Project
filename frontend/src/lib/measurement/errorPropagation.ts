/**
 * Propagation of measurement error through a product (area, volume).
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১.৭, pp. 26–28.
 *
 * The book works the bounds explicitly rather than using the differential
 * approximation, so this module does the same — a student comparing the screen
 * to the page must see the same arithmetic:
 *
 *     V_min = Π (xᵢ - Δxᵢ)
 *     V_max = Π (xᵢ + Δxᵢ)
 *     চূড়ান্ত ত্রুটি (absolute error) = max(V - V_min, V_max - V)
 *     আপেক্ষিক ত্রুটি (relative)      = absolute / V × 100 %
 *
 * The teaching payload, stated on p. 28: a 10 % error in length becomes roughly
 * double in area and triple in volume.
 */

export interface Measurement {
  /** Measured value. */
  value: number
  /** Uncertainty (± half the smallest division, by the rule on p. 26). */
  uncertainty: number
  /** Label for display, e.g. দৈর্ঘ্য. */
  label?: string
}

export interface PropagationResult {
  /** Product of the nominal values. */
  nominal: number
  /** Smallest product consistent with the uncertainties. */
  minimum: number
  /** Largest product consistent with the uncertainties. */
  maximum: number
  /** চূড়ান্ত ত্রুটি — the book takes the larger of the two deviations. */
  absoluteError: number
  /** আপেক্ষিক ত্রুটি as a percentage. */
  relativeErrorPercent: number
}

function roundTo(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * Uncertainty of a single reading: half the smallest division of the
 * instrument. Book p. 26 — a cm-only ruler gives ± 0.5 cm.
 */
export function readingUncertainty(smallestDivision: number): number {
  return roundTo(smallestDivision / 2)
}

export function propagateProduct(dims: Measurement[]): PropagationResult {
  if (dims.length === 0) throw new Error('need at least one measurement')
  if (dims.some((d) => d.uncertainty < 0)) {
    throw new Error('uncertainty must be non-negative')
  }
  if (dims.some((d) => d.value - d.uncertainty < 0)) {
    throw new Error('uncertainty cannot exceed the measured value')
  }

  const nominal = dims.reduce((acc, d) => acc * d.value, 1)
  const minimum = dims.reduce((acc, d) => acc * (d.value - d.uncertainty), 1)
  const maximum = dims.reduce((acc, d) => acc * (d.value + d.uncertainty), 1)

  // p. 28: "আমরা বড়টি নিই" — take the larger deviation as the absolute error.
  const absoluteError = Math.max(nominal - minimum, maximum - nominal)

  return {
    nominal: roundTo(nominal),
    minimum: roundTo(minimum),
    maximum: roundTo(maximum),
    absoluteError: roundTo(absoluteError),
    relativeErrorPercent: roundTo((absoluteError / nominal) * 100),
  }
}

/**
 * Formats a measurement as the book writes it: (4.0 ± 0.5) cm, p. 26.
 */
export function formatWithUncertainty(
  m: Measurement,
  unit: string,
  decimals = 1,
): string {
  return `(${m.value.toFixed(decimals)} ± ${m.uncertainty.toFixed(decimals)}) ${unit}`
}
