/**
 * Screw gauge (micrometer) reading model.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), p. 22.
 *
 * The book states: one full rotation advances the scale by the pitch (1 mm);
 * the circular scale carries 100 equal divisions; therefore one division
 * advances 1/100 mm, and the least count (নূন্যাঙ্ক) is 0.01 mm.
 *
 *     LC (নূন্যাঙ্ক) = pitch / circularDivisions
 *     পাঠ (reading)  = linearScale + (circularScale × LC)
 *
 * Note how closely this mirrors `vernier.ts` — same quantise-and-read shape,
 * different geometry. That similarity is the point: it is the evidence that the
 * component registry makes a second instrument cheap.
 */

export interface ScrewGaugeConfig {
  /** Distance the spindle advances per full rotation, in mm. Book uses 1 mm. */
  pitch: number
  /** Divisions around the thimble. Book uses 100. */
  circularDivisions: number
}

export interface ScrewGaugeReading {
  /** Linear (sleeve) scale reading, in mm. */
  linearScale: number
  /** Circular (thimble) division under the reference line, 0 … divisions-1. */
  circularScale: number
  /** Least count, in mm. */
  leastCount: number
  /** Total reading, in mm. */
  reading: number
  /** Whole rotations made from zero — drives the thimble render angle. */
  rotations: number
}

function roundTo(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** LC = pitch / circularDivisions. Book p. 22: 1/100 mm = 0.01 mm. */
export function leastCount(config: ScrewGaugeConfig): number {
  const { pitch, circularDivisions } = config
  if (circularDivisions <= 0) {
    throw new Error('circularDivisions must be positive')
  }
  return roundTo(pitch / circularDivisions)
}

export function readScrewGauge(
  trueLength: number,
  config: ScrewGaugeConfig,
): ScrewGaugeReading {
  if (trueLength < 0) throw new Error('trueLength must be non-negative')

  const { pitch, circularDivisions } = config
  const LC = leastCount(config)

  let linearScale = Math.floor(roundTo(trueLength / pitch, 9)) * pitch
  const remainder = trueLength - linearScale

  let circularScale = Math.round(remainder / LC)
  if (circularScale >= circularDivisions) {
    linearScale = roundTo(linearScale + pitch)
    circularScale -= circularDivisions
  }

  return {
    linearScale: roundTo(linearScale),
    circularScale,
    leastCount: LC,
    reading: roundTo(linearScale + circularScale * LC),
    rotations: roundTo(linearScale / pitch),
  }
}

/**
 * Thimble rotation in degrees, for the SVG transform. Continuous rather than
 * quantised, because the thimble turns smoothly even though it reads discretely.
 */
export function thimbleAngle(
  trueLength: number,
  config: ScrewGaugeConfig,
): number {
  return roundTo(((trueLength / config.pitch) % 1) * 360, 4)
}

export function checkScrewGaugeAnswer(
  submitted: number,
  trueLength: number,
  config: ScrewGaugeConfig,
): { correct: boolean; expected: number; toleranceMm: number } {
  const expected = readScrewGauge(trueLength, config).reading
  const tolerance = leastCount(config) / 2
  // See the note in vernier.ts — boundary answers must not fail on float dust.
  const difference = roundTo(Math.abs(submitted - expected))
  return {
    correct: difference <= tolerance,
    expected,
    toleranceMm: tolerance,
  }
}
