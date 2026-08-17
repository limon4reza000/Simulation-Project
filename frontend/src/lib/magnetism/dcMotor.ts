/**
 * The DC motor's turning rule, and why it needs a commutator.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১২.২.৩ তড়িৎপ্রবাহী
 * তারের ওপর চুম্বকের প্রভাব, pp. 335–336, and §১২.২.৪ ডিসি মোটর, pp. 336–338.
 *
 * The book's reasoning (pp. 336–338): a current-carrying coil sitting in a
 * magnetic field feels a torque that turns it toward alignment with the
 * field — চিত্র ১২.১০'s own four snapshots show a coil rotating step by
 * step toward that aligned resting position. Once aligned, there is no more
 * torque and it would simply stop — unless, exactly at that moment, the
 * current through the coil is reversed by a commutator, which makes the
 * torque reappear (now pushing the *other* way, since the field relative to
 * the reversed current has effectively flipped) and keeps the coil turning
 * past alignment rather than settling there. This module models that
 * discrete step-by-step rule directly, the same "rule engine, not equation"
 * shape as magneticFieldDirection.ts.
 *
 * No React — pure logic, reused by the renderer and directly testable.
 */

/** Angle (degrees, 0-180) between the coil's own field and the external field; 0 = aligned. */
export type CoilAngleDeg = number

/**
 * Torque direction on the coil at a given angle from alignment: it always
 * pushes toward alignment (0°), per the book's own description of চিত্র
 * ১২.১০'s four-step sequence. Exactly at 0° or 180° there is no torque —
 * these are the two states the book calls out as requiring the commutator's
 * intervention to escape.
 */
export type TorqueDirection = 'toward-alignment' | 'none'

export function torqueAt(angleDeg: CoilAngleDeg): TorqueDirection {
  if (angleDeg < 0 || angleDeg > 180) {
    throw new Error('angle must be between 0 and 180 degrees')
  }
  if (angleDeg === 0 || angleDeg === 180) return 'none'
  return 'toward-alignment'
}

/**
 * Whether the coil is at a "dead point" — aligned with the field, where
 * torque vanishes and a commutator must reverse the current to keep the
 * motor turning rather than let it settle there (p. 337-338's own point).
 */
export function isDeadPoint(angleDeg: CoilAngleDeg): boolean {
  return torqueAt(angleDeg) === 'none'
}

/**
 * Advances the coil by one simulation step. Past a dead point, the
 * commutator reverses the coil's current (modelled here as the coil
 * continuing to rotate through it rather than reversing back), exactly the
 * book's own description of continuous rotation rather than settling.
 */
export function advanceAngle(angleDeg: CoilAngleDeg, stepDeg: number): CoilAngleDeg {
  if (stepDeg <= 0) throw new Error('step must be positive')
  const next = angleDeg + stepDeg
  return next >= 180 ? next - 180 : next
}
