/**
 * The right-hand grip rule for the magnetic field around a current.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১২.২ বিদ্যুতের
 * চৌম্বক ক্রিয়া, pp. 331–333.
 *
 * The book states the rule directly (p. 333): point the right thumb along
 * the current's direction, and the curled fingers show the magnetic field's
 * circulation direction around the wire. চিত্র ১২.০২ demonstrates it with a
 * vertical wire through a horizontal sheet of compasses — current flowing up
 * gives one circulation, current flowing down gives the reverse — and its
 * own worked question (p. 333, চিত্র ১২.০৪) asks a student to pick the
 * correct field diagram for a given current direction out of two candidates.
 *
 * This is a deterministic rule, not a numeric equation — the same shape as
 * lawOfReflection.ts in Chapter 8 — so this module is a rule engine rather
 * than an algebraic formula, and is directly testable as such.
 *
 * No React — pure logic, reused by the renderer and directly testable.
 */

export type CurrentDirection = 'up' | 'down'
export type FieldCirculation = 'counterclockwise' | 'clockwise'

/**
 * The field's circulation direction around a straight vertical wire, viewed
 * from above, for a given current direction (p. 333, চিত্র ১২.০২–১২.০৪).
 * Current flowing up (toward the viewer, out of the page from above) gives a
 * counter-clockwise field by the right-hand grip rule; current flowing down
 * reverses it.
 */
export function fieldAroundStraightWire(current: CurrentDirection): FieldCirculation {
  return current === 'up' ? 'counterclockwise' : 'clockwise'
}

export type LoopWinding = 'clockwise' | 'counterclockwise'
export type PoleDirection = 'toward-viewer' | 'away-from-viewer'

/**
 * Which face of a current loop (or one turn of a solenoid) becomes the
 * north-seeking pole, viewed from that face — the same grip rule applied to
 * a loop instead of a straight wire (p. 334, §১২.২.১ সলিনয়েড): current
 * circulating counter-clockwise as viewed from a face makes that face the
 * north pole (field points toward the viewer, out of that face), matching
 * how the book identifies a solenoid's north end from its winding direction
 * and current.
 */
export function solenoidPoleFace(winding: LoopWinding): PoleDirection {
  return winding === 'counterclockwise' ? 'toward-viewer' : 'away-from-viewer'
}

/** Reversing the current direction always reverses the field circulation (p. 332's own stated point). */
export function reverseCurrent(current: CurrentDirection): CurrentDirection {
  return current === 'up' ? 'down' : 'up'
}
