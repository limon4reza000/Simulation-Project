/**
 * Transformers: turns ratio, voltage and current transformation.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §১২.৩.২ ট্রান্সফর্মার,
 * pp. 340–342.
 *
 * The book derives the voltage relation from the turns ratio directly
 * (p. 341): Vp/np = Vs/ns, so Vs = (ns/np)Vp. The current relation follows
 * from conservation of electrical power across an (idealised, lossless)
 * transformer (p. 341): VpIp = VsIs, so Is = (Vp/Vs)Ip = (np/ns)Ip. Its own
 * first worked example (p. 342) makes a point of the mechanism, not just the
 * arithmetic: a transformer does nothing at all on DC, because there is no
 * changing flux to induce anything — only AC's constantly changing current
 * makes a transformer work.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own three worked examples plus two sample-question
 * fixtures.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** Vs = (ns/np)Vp (p. 341). Zero for a DC source — no changing flux, no induced EMF (p. 342). */
export function secondaryVoltage(
  primaryVoltageV: number,
  primaryTurns: number,
  secondaryTurns: number,
  isAC: boolean,
): number {
  if (primaryTurns <= 0 || secondaryTurns <= 0) throw new Error('turns must be positive')
  if (!isAC) return 0
  return round((secondaryTurns / primaryTurns) * primaryVoltageV)
}

/** Is = (Vp/Vs)Ip = (np/ns)Ip (p. 341), the power-conservation relation. */
export function secondaryCurrent(
  primaryCurrentA: number,
  primaryTurns: number,
  secondaryTurns: number,
): number {
  if (primaryTurns <= 0 || secondaryTurns <= 0) throw new Error('turns must be positive')
  return round((primaryTurns / secondaryTurns) * primaryCurrentA)
}

/** ns = np(Vs/Vp) (p. 344 sample question), the turns relation solved for the unknown secondary turns. */
export function secondaryTurnsFromVoltages(
  primaryTurns: number,
  primaryVoltageV: number,
  secondaryVoltageV: number,
): number {
  if (primaryTurns <= 0) throw new Error('primary turns must be positive')
  if (primaryVoltageV <= 0) throw new Error('primary voltage must be positive')
  return round(primaryTurns * (secondaryVoltageV / primaryVoltageV))
}

export type TransformerKind = 'step-up' | 'step-down' | 'isolation'

/** Whether the transformer steps voltage up, down, or leaves it unchanged (p. 341-342). */
export function transformerKind(primaryTurns: number, secondaryTurns: number): TransformerKind {
  if (primaryTurns <= 0 || secondaryTurns <= 0) throw new Error('turns must be positive')
  if (secondaryTurns > primaryTurns) return 'step-up'
  if (secondaryTurns < primaryTurns) return 'step-down'
  return 'isolation'
}
