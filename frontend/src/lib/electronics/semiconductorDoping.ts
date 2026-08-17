/**
 * n-type vs p-type semiconductor doping.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১৩.৪ সেমিকন্ডাক্টর,
 * pp. 357–358.
 *
 * Silicon has four valence electrons, each shared with a neighbouring atom
 * in the crystal lattice, leaving none free to conduct (p. 357). The book
 * explains doping by valence-electron count directly: mixing in an atom
 * with five valence electrons (phosphorus, p. 358) leaves one electron with
 * no bond to join, free to wander through the lattice as a mobile negative
 * charge carrier — an n-type semiconductor. Mixing in an atom with three
 * valence electrons instead (boron, p. 358) leaves one bond short an
 * electron, an absence the book calls a "hole" that behaves as a mobile
 * positive charge carrier as neighbouring electrons hop in to fill it — a
 * p-type semiconductor.
 *
 * No React — pure logic, a deterministic classifier reused by the renderer
 * and directly testable against the book's own two examples (phosphorus,
 * boron) plus silicon's own baseline.
 */

const SILICON_VALENCE_ELECTRONS = 4

export type DopantType = 'n-type' | 'p-type' | 'intrinsic'

/**
 * Classifies the doped semiconductor from a dopant's own valence-electron
 * count (p. 358): more than silicon's four gives n-type (an extra free
 * electron); fewer gives p-type (a hole); exactly four is undoped silicon
 * itself.
 */
export function classifyDopant(dopantValenceElectrons: number): DopantType {
  if (!Number.isInteger(dopantValenceElectrons) || dopantValenceElectrons < 1 || dopantValenceElectrons > 7) {
    throw new Error('valence electron count must be an integer between 1 and 7')
  }
  if (dopantValenceElectrons > SILICON_VALENCE_ELECTRONS) return 'n-type'
  if (dopantValenceElectrons < SILICON_VALENCE_ELECTRONS) return 'p-type'
  return 'intrinsic'
}

export type ChargeCarrier = 'free electron' | 'hole' | 'none'

/** The mobile charge carrier a given dopant introduces (p. 358). */
export function chargeCarrierFor(dopantValenceElectrons: number): ChargeCarrier {
  const kind = classifyDopant(dopantValenceElectrons)
  if (kind === 'n-type') return 'free electron'
  if (kind === 'p-type') return 'hole'
  return 'none'
}

/** Two of the book's own named dopants, for a selector UI (p. 358). */
export const NAMED_DOPANTS = [
  { key: 'phosphorus', labelBn: 'ফসফরাস', labelEn: 'Phosphorus', valenceElectrons: 5 },
  { key: 'boron', labelBn: 'বোরন', labelEn: 'Boron', valenceElectrons: 3 },
  { key: 'silicon', labelBn: 'সিলিকন (অবিশুদ্ধ নয়)', labelEn: 'Silicon (undoped)', valenceElectrons: 4 },
] as const
