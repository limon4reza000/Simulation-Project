/**
 * Which shield stops which type of radiation.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১৩.১.১ আলফা রশ্মি
 * (p. 350), §১৩.১.২ বিটা রশ্মি (p. 351), §১৩.১.৩ গামা রশ্মি (p. 352), চিত্র
 * ১৩.০১.
 *
 * The book states, and চিত্র ১৩.০১ draws side by side, that the three
 * radiation types need very different shielding: alpha particles are heavy
 * and stop within about 6 cm of air, so a single sheet of paper stops them
 * completely; beta particles (electrons) are far lighter and penetrate
 * paper, needing a few millimetres of aluminium; gamma rays are
 * electromagnetic waves with no charge or mass at all, needing several
 * centimetres of lead to be absorbed. This module is a deterministic rule
 * engine over exactly those three printed thresholds, the same "rule
 * engine, not equation" shape as several of Chapter 12's artefacts.
 *
 * No React — pure logic, reused by the renderer and directly testable.
 */

export type RadiationType = 'alpha' | 'beta' | 'gamma'
export type ShieldMaterial = 'paper' | 'aluminium' | 'lead'

/** Minimum shield thickness (mm) that stops each radiation type, per চিত্র ১৩.০১'s own printed ranges. */
const MIN_THICKNESS_MM: Record<RadiationType, Partial<Record<ShieldMaterial, number>>> = {
  alpha: { paper: 0 }, // any paper stops it (p. 350)
  beta: { aluminium: 3 }, // 3-5 mm aluminium (p. 351)
  gamma: { lead: 30 }, // 3-5 cm lead (p. 352)
}

/** Whether a given radiation type is stopped by the given material at the given thickness (mm). */
export function isBlocked(
  radiation: RadiationType,
  material: ShieldMaterial,
  thicknessMm: number,
): boolean {
  if (thicknessMm < 0) throw new Error('thickness must be non-negative')
  const required = MIN_THICKNESS_MM[radiation][material]
  if (required === undefined) return false
  return thicknessMm >= required
}

/** The book's own minimal recommended shield for each radiation type (p. 350-352). */
export function recommendedShield(radiation: RadiationType): ShieldMaterial {
  if (radiation === 'alpha') return 'paper'
  if (radiation === 'beta') return 'aluminium'
  return 'lead'
}
