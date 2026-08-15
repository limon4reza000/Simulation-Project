/**
 * Variation of sound speed with temperature and medium.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৭.৩.২ শব্দের বেগের
 * পার্থক্য, pp. 202–203.
 *
 * The book states the relation as a direct proportionality to the square
 * root of the *absolute* (Kelvin) temperature (p. 202): v ∝ √T, explicitly
 * warning that T here is not Celsius. Its own worked example (p. 203) scales
 * a measured 338 m/s at 10°C up to 30°C. টেবিল ৭.০১ (p. 202) separately
 * prints the speed of sound in six named media at one reference condition,
 * reflecting how much stiffer solids and liquids are than air, not a
 * temperature effect at all.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** °C to K, since the book is explicit that v ∝ √T uses absolute temperature. */
function celsiusToKelvin(celsius: number): number {
  return celsius + 273.15
}

/**
 * v1 = v2 * sqrt(T1/T2) (p. 203), scaling a known speed at one temperature
 * to another. Temperatures are taken in Celsius here (matching how the book
 * poses the problem) and converted internally.
 */
export function speedAtTemperature(
  knownSpeedMs: number,
  knownTempC: number,
  targetTempC: number,
): number {
  if (knownSpeedMs <= 0) throw new Error('known speed must be positive')
  const t1 = celsiusToKelvin(targetTempC)
  const t2 = celsiusToKelvin(knownTempC)
  if (t1 <= 0 || t2 <= 0) throw new Error('temperature must be above absolute zero')
  return round(knownSpeedMs * Math.sqrt(t1 / t2))
}

export interface Medium {
  key: string
  labelBn: string
  labelEn: string
  /** m/s, from টেবিল ৭.০১, p. 202. */
  speedMs: number
}

/** টেবিল ৭.০১'s six printed media, in the book's own order. */
export const SOUND_SPEED_TABLE: readonly Medium[] = [
  { key: 'air', labelBn: 'বাতাস', labelEn: 'Air', speedMs: 330 },
  { key: 'hydrogen', labelBn: 'হাইড্রোজেন', labelEn: 'Hydrogen', speedMs: 1284 },
  { key: 'mercury', labelBn: 'পারদ', labelEn: 'Mercury', speedMs: 1450 },
  { key: 'water', labelBn: 'পানি', labelEn: 'Water', speedMs: 1493 },
  { key: 'iron', labelBn: 'লোহা', labelEn: 'Iron', speedMs: 5130 },
  { key: 'diamond', labelBn: 'হীরা', labelEn: 'Diamond', speedMs: 12000 },
]
