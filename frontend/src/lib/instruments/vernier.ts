/**
 * Vernier caliper reading model.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), pp. 20–22 and
 * অনুসন্ধান ১.০১ on p. 25.
 *
 *     VC (ভার্নিয়ার ধ্রুবক) = S / n
 *     পাঠ (reading)          = M + (V × VC)
 *
 * where S is the smallest main-scale division, n the number of vernier
 * divisions, M the main-scale reading immediately before the vernier zero, and
 * V the index of the vernier line that coincides with a main-scale line.
 *
 * This module deliberately contains no React. Keeping it pure is what lets the
 * same code serve the renderer, the practise-mode auto-grader, and the unit
 * tests that check it against the textbook's own worked figures.
 */

export interface VernierConfig {
  /** Smallest main-scale division, in mm. 1 mm on a standard metric caliper. */
  mainScaleDivision: number
  /** Number of vernier divisions (n). The book uses 10; 20 and 50 also exist. */
  vernierDivisions: number
}

export interface VernierReading {
  /** Main-scale reading M, in mm — the last main division fully passed. */
  mainScale: number
  /** Index V of the coinciding vernier line, 0 … n-1. */
  vernierCoincidence: number
  /** Vernier constant VC (least count), in mm. */
  vernierConstant: number
  /** Total reading M + (V × VC), in mm. */
  reading: number
}

/** Rounds away floating-point dust without hiding genuine precision. */
function roundTo(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/**
 * VC = S / n. Book p. 25 records this as the "ভার্নিয়ার ধ্রুবক" step of the
 * investigation, computed before any measurement is taken.
 */
export function vernierConstant(config: VernierConfig): number {
  const { mainScaleDivision, vernierDivisions } = config
  if (vernierDivisions <= 0) {
    throw new Error('vernierDivisions must be positive')
  }
  return roundTo(mainScaleDivision / vernierDivisions)
}

/**
 * Length of one vernier division.
 *
 * n vernier divisions span (n-1) main divisions, which is what makes exactly
 * one vernier line coincide for any given remainder. See চিত্র ১.০৭, which
 * shows the scale shifted by one, two and three divisions.
 */
export function vernierDivisionLength(config: VernierConfig): number {
  const { mainScaleDivision, vernierDivisions } = config
  return roundTo((mainScaleDivision * (vernierDivisions - 1)) / vernierDivisions)
}

/**
 * Given a true jaw separation, produce the reading a student would take.
 *
 * The instrument quantises: it can only resolve to VC, so this is also the
 * model of what the caliper *can* measure, not merely how it is read.
 */
export function readVernier(
  trueLength: number,
  config: VernierConfig,
): VernierReading {
  if (trueLength < 0) throw new Error('trueLength must be non-negative')

  const { mainScaleDivision: S, vernierDivisions: n } = config
  const VC = vernierConstant(config)

  let mainScale = Math.floor(roundTo(trueLength / S, 9)) * S
  const remainder = trueLength - mainScale

  // Which vernier line lands on a main-scale line? Solving
  //   remainder - k·(S/n) ≡ 0 (mod S)  gives  k = remainder / VC.
  let coincidence = Math.round(remainder / VC)

  // A remainder just under S rounds up to n, which is really the next main
  // division with the vernier zero aligned.
  if (coincidence >= n) {
    mainScale = roundTo(mainScale + S)
    coincidence -= n
  }

  return {
    mainScale: roundTo(mainScale),
    vernierCoincidence: coincidence,
    vernierConstant: VC,
    reading: roundTo(mainScale + coincidence * VC),
  }
}

/**
 * Mean of repeated observations — the "গড় পাঠ" column of টেবিল ১.০৬.
 * The investigation asks for several observations precisely because a single
 * one carries no information about spread.
 */
export function averageReading(readings: number[]): number {
  if (readings.length === 0) throw new Error('need at least one reading')
  const sum = readings.reduce((a, b) => a + b, 0)
  return roundTo(sum / readings.length)
}

/**
 * Grades a practise-mode answer. Anything within half a least count is
 * indistinguishable on the instrument, so it is accepted.
 */
export function checkVernierAnswer(
  submitted: number,
  trueLength: number,
  config: VernierConfig,
): { correct: boolean; expected: number; toleranceMm: number } {
  const expected = readVernier(trueLength, config).reading
  const tolerance = vernierConstant(config) / 2
  // Round the difference before comparing: an answer sitting exactly on the
  // tolerance boundary must be accepted, and raw subtraction of decimals puts
  // it a few ulps over. A student should never be marked wrong by float dust.
  const difference = roundTo(Math.abs(submitted - expected))
  return {
    correct: difference <= tolerance,
    expected,
    toleranceMm: tolerance,
  }
}
