/**
 * Charge as a discrete, quantised quantity — friction charging.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১০.১ আধান বা চার্জ,
 * pp. 272–273, and §১০.২ ঘর্ষণে স্থির বিদ্যুৎ তৈরি, pp. 274–275.
 *
 * The book is explicit (p. 272) that every charge, however it is produced —
 * friction, induction, anything — is built from a whole number of electrons
 * moving from one object to another, each carrying exactly
 * e = 1.6×10⁻¹⁹ C (p. 273). Rubbing glass with silk (p. 274) moves electrons
 * from the glass to the silk, leaving the glass positively charged by
 * exactly as many elementary charges as crossed over; rubbing plastic with
 * flannel moves them the other way.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

const ELEMENTARY_CHARGE_C = 1.6e-19

/**
 * Total charge from a whole number of transferred electrons (p. 273).
 * `electronCount` must be an integer — charge is quantised, not continuous.
 */
export function chargeFromElectronCount(electronCount: number, sign: 1 | -1 = -1): number {
  if (!Number.isInteger(electronCount) || electronCount < 0) {
    throw new Error('electron count must be a non-negative integer')
  }
  return sign * electronCount * ELEMENTARY_CHARGE_C
}

/** The number of elementary charges making up a given total charge, rounded to the nearest whole electron. */
export function electronCountFromCharge(chargeC: number): number {
  return Math.round(Math.abs(chargeC) / ELEMENTARY_CHARGE_C)
}

/**
 * Rubbing two materials transfers `electronCount` electrons from the
 * "giver" to the "taker" (p. 274) — the giver ends up positively charged by
 * exactly that many elementary charges, the taker negatively, always equal
 * and opposite (charge is neither created nor destroyed in the process).
 */
export function rubCharges(electronCount: number): { giverCharge: number; takerCharge: number } {
  // Not passed through round(): at ~1e-19 C per electron, a fixed-decimal-place
  // round would need decimals far beyond what serves any other quantity in
  // this module — see the identical fix in coulombsLaw.ts's coulombForce().
  const taker = chargeFromElectronCount(electronCount, -1)
  return { giverCharge: -taker, takerCharge: taker }
}
