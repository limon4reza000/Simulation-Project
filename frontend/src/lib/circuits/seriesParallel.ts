/**
 * Equivalent resistance for series and parallel resistor combinations.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১১.২.৪ তুল্য রোধ:
 * শ্রেণি সংযোগ, pp. 314–315, and §১১.২.৫ তুল্য রোধ: সমান্তরাল বর্তনী সংযোগ,
 * pp. 315–317.
 *
 * The book derives both from the same two circuit facts it establishes in
 * §১১.২.৩ (p. 310): current in equals current out at every point (charge is
 * neither created nor destroyed), and Ohm's law holds across any two points
 * of a circuit. In series, the same current flows through every resistor in
 * turn, so their voltage drops add: R = R₁+R₂+...+Rₙ (p. 315). In parallel,
 * the same voltage appears across every resistor, so their currents add:
 * 1/R = 1/R₁+1/R₂+...+1/Rₙ (p. 317).
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own two fully-worked circuits (a three-resistor series
 * chain and a two-resistor parallel pair).
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** R = R1+R2+...+Rn (p. 315). */
export function seriesResistance(resistances: number[]): number {
  if (resistances.length === 0) throw new Error('at least one resistor is required')
  if (resistances.some((r) => r <= 0)) throw new Error('every resistance must be positive')
  return round(resistances.reduce((sum, r) => sum + r, 0))
}

/** 1/R = 1/R1+1/R2+...+1/Rn (p. 317). */
export function parallelResistance(resistances: number[]): number {
  if (resistances.length === 0) throw new Error('at least one resistor is required')
  if (resistances.some((r) => r <= 0)) throw new Error('every resistance must be positive')
  const inverseSum = resistances.reduce((sum, r) => sum + 1 / r, 0)
  return round(1 / inverseSum)
}

export interface SeriesResult {
  equivalentOhm: number
  currentA: number
  /** Voltage drop across each resistor, in the order given. */
  voltageDropsV: number[]
}

/** Full series analysis: one shared current, individual voltage drops (p. 313's own worked example). */
export function analyzeSeries(voltageV: number, resistances: number[]): SeriesResult {
  const equivalentOhm = seriesResistance(resistances)
  const currentA = round(voltageV / equivalentOhm)
  return {
    equivalentOhm,
    currentA,
    voltageDropsV: resistances.map((r) => round(r * currentA)),
  }
}

export interface ParallelResult {
  equivalentOhm: number
  totalCurrentA: number
  /** Current through each resistor, in the order given. */
  branchCurrentsA: number[]
}

/** Full parallel analysis: one shared voltage, individual branch currents (p. 314's own worked example). */
export function analyzeParallel(voltageV: number, resistances: number[]): ParallelResult {
  const equivalentOhm = parallelResistance(resistances)
  const branchCurrentsA = resistances.map((r) => round(voltageV / r))
  return {
    equivalentOhm,
    totalCurrentA: round(branchCurrentsA.reduce((sum, i) => sum + i, 0)),
    branchCurrentsA,
  }
}
