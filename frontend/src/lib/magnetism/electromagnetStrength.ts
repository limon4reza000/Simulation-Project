/**
 * Relative strength of an electromagnet.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১২.২.২ তাড়িতচুম্বক,
 * pp. 334–335.
 *
 * The book states two proportionalities in words, without printing a
 * combined formula (p. 335): a stronger current gives a stronger field, and
 * more coil turns gives a stronger field, because each turn's own
 * contribution to the field adds to the others'. This module makes that
 * explicit dual proportionality (strength ∝ current, strength ∝ turns)
 * quantitative and interactive — it is not the book's own printed equation
 * (none is given), and is documented as such rather than misattributed to a
 * page that only states the relationship in words.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own two proportionality statements.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * A relative field-strength value (arbitrary units): proportional to
 * current and to the number of turns, exactly the two relationships the
 * book states explicitly (p. 335). Not an absolute physical unit — the book
 * gives no constant of proportionality — so this is deliberately a relative
 * comparison, useful for exploring the trend rather than reading off a real
 * field strength in tesla.
 */
export function relativeFieldStrength(currentA: number, turns: number): number {
  if (currentA < 0) throw new Error('current must be non-negative')
  if (turns <= 0 || !Number.isInteger(turns)) throw new Error('turns must be a positive integer')
  return round(currentA * turns)
}
