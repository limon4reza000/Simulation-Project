/**
 * Wave-related quantities: amplitude, wavelength, period, frequency, speed.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৭.২.৩ তরঙ্গ-সংশ্লিষ্ট
 * রাশি, pp. 195–198.
 *
 * The book's own worked example (pp. 196–197) reads amplitude and wavelength
 * off one snapshot (displacement vs. position, চিত্র ৭.০৬) and amplitude and
 * period off a second snapshot at a fixed point (displacement vs. time,
 * চিত্র ৭.০৭) — neither snapshot alone gives every quantity, echoing the
 * book's own point that a position-domain graph cannot yield period, and a
 * time-domain graph cannot yield wavelength. Combined (চিত্র ৭.০৮), f = 1/T
 * and v = fλ give the wave's frequency and speed.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against that combined example (λ = 1 m, T = 0.2 s → f = 5 Hz, v = 5 m/s).
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** f = 1/T (p. 195). */
export function frequency(periodS: number): number {
  if (periodS <= 0) throw new Error('period must be positive')
  return round(1 / periodS)
}

/** v = fλ, the book's own wave equation (p. 195). */
export function waveSpeed(frequencyHz: number, wavelengthM: number): number {
  if (frequencyHz <= 0) throw new Error('frequency must be positive')
  if (wavelengthM <= 0) throw new Error('wavelength must be positive')
  return round(frequencyHz * wavelengthM)
}

/**
 * Wavelength recovered from a wave's speed and frequency (p. 201's own
 * worked direction: λ = v/f, used to compare the same 1 kHz tone across
 * different media).
 */
export function wavelengthFromSpeed(speedMs: number, frequencyHz: number): number {
  if (speedMs <= 0) throw new Error('speed must be positive')
  if (frequencyHz <= 0) throw new Error('frequency must be positive')
  return round(speedMs / frequencyHz)
}

export interface WaveSnapshot {
  amplitudeM: number
  wavelengthM: number
  periodS: number
}

export interface WaveDescription extends WaveSnapshot {
  frequencyHz: number
  speedMs: number
}

/** Combines a full snapshot into every derived quantity at once. */
export function describeWave(snapshot: WaveSnapshot): WaveDescription {
  const f = frequency(snapshot.periodS)
  return {
    ...snapshot,
    frequencyHz: f,
    speedMs: waveSpeed(f, snapshot.wavelengthM),
  }
}

/**
 * Intensity carried by a wave is proportional to the square of its amplitude
 * (p. 190, restated for sound at p. 200): doubling amplitude quadruples the
 * energy flow. Returns a relative value (intensity / reference amplitude²),
 * since the book states only the proportionality, not an absolute constant.
 */
export function relativeIntensity(amplitudeM: number, referenceAmplitudeM: number): number {
  if (amplitudeM < 0) throw new Error('amplitude must be non-negative')
  if (referenceAmplitudeM <= 0) throw new Error('reference amplitude must be positive')
  return round((amplitudeM / referenceAmplitudeM) ** 2)
}
