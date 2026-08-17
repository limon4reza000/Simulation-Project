/**
 * Decimal <-> binary conversion.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১৩.৩ অ্যানালগ ও
 * ডিজিটাল ইলেকট্রনিকস, pp. 356–357.
 *
 * The book's own point (p. 356–357) is that digital electronics represents
 * any value as a number built from just two symbols, 0 and 1 — because a
 * circuit can represent "0 volts" and "some voltage" reliably, where a
 * continuously-variable analog voltage is easily corrupted by noise. It
 * names this base-2 representation বাইনারি (binary) directly, without
 * printing a worked numeric conversion — this module supplies exactly that
 * mechanical piece, grounding the concept the book introduces in words.
 *
 * No React — pure arithmetic/string logic, reused by the renderer and
 * directly testable against ordinary binary arithmetic.
 */

/** Decimal (non-negative integer) to its binary string representation. */
export function decimalToBinary(decimal: number): string {
  if (!Number.isInteger(decimal) || decimal < 0) {
    throw new Error('decimal value must be a non-negative integer')
  }
  return decimal.toString(2)
}

/** Binary string (only 0s and 1s) back to its decimal value. */
export function binaryToDecimal(binary: string): number {
  if (binary.length === 0 || !/^[01]+$/.test(binary)) {
    throw new Error('binary string must be non-empty and contain only 0s and 1s')
  }
  return Number.parseInt(binary, 2)
}

/** The individual bit values (most significant first) for a decimal value — for a live bit-pattern display. */
export function bitsFor(decimal: number, widthBits: number): boolean[] {
  const binary = decimalToBinary(decimal)
  if (binary.length > widthBits) {
    throw new Error(`value does not fit in ${widthBits} bits`)
  }
  const padded = binary.padStart(widthBits, '0')
  return padded.split('').map((bit) => bit === '1')
}
