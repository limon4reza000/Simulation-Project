/**
 * Temperature vs. heat added, through melting and boiling — চিত্র ৬.০৮.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৬.৪ পদার্থের
 * অবস্থার পরিবর্তনে তাপের প্রভাব, pp. 175–177.
 *
 * The book's own figure (চিত্র ৬.০৮, p. 176) draws exactly one shape: a solid
 * heats up (temperature rises), reaches its melting point and holds flat
 * while it melts (all the added heat goes into breaking molecular bonds, not
 * raising temperature — the book calls this heat the গলনের সুপ্ততাপ, latent
 * heat of fusion), then the liquid heats up again, reaches its boiling
 * point and holds flat again while it boils (বাষ্পীভবনের সুপ্ততাপ, latent
 * heat of vaporisation), then the gas heats up. This module reproduces that
 * five-segment shape directly from a substance's own thermal constants
 * (specific heats of each phase, melting/boiling points, latent heats)
 * rather than from an idealised single number.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export interface SubstanceThermalProfile {
  /** J/(kg·K), for the solid phase. */
  specificHeatSolid: number
  /** J/(kg·K), for the liquid phase. */
  specificHeatLiquid: number
  /** J/(kg·K), for the gas phase. */
  specificHeatGas: number
  /** °C. */
  meltingPointC: number
  /** °C. */
  boilingPointC: number
  /** J/kg — heat absorbed per kg during melting, at constant temperature. */
  latentHeatFusion: number
  /** J/kg — heat absorbed per kg during boiling, at constant temperature. */
  latentHeatVaporization: number
}

/**
 * Water's constants. specificHeatLiquid (4200 J/kg·K), meltingPointC,
 * boilingPointC and latentHeatFusion (334,000 J/kg = 334 kJ/kg) are the
 * book's own printed values, used directly in its §৬.৫–৬.৬ calorimetry
 * worked examples (pp. 179–180). specificHeatSolid, specificHeatGas and
 * latentHeatVaporization are not printed anywhere in this chapter's read
 * pages — these are standard reference values for ice and steam, documented
 * as such rather than attributed to a page that does not state them.
 */
export const WATER: SubstanceThermalProfile = {
  specificHeatSolid: 2100,
  specificHeatLiquid: 4200,
  specificHeatGas: 2000,
  meltingPointC: 0,
  boilingPointC: 100,
  latentHeatFusion: 334000,
  latentHeatVaporization: 2260000,
}

export type Phase = 'solid' | 'melting' | 'liquid' | 'boiling' | 'gas'

export interface HeatingCurvePoint {
  /** Cumulative heat added so far, in joules. */
  heatJ: number
  temperatureC: number
  phase: Phase
}

/**
 * The five cumulative-heat boundaries of the curve, for a mass `massKg`
 * starting at `startTempC` (must be at or below the melting point) and
 * heated up to `endTempC` (must be at or above the boiling point) — the
 * full solid-to-gas journey চিত্র ৬.০৮ draws.
 */
export function heatingCurveBoundaries(
  profile: SubstanceThermalProfile,
  massKg: number,
  startTempC: number,
  endTempC: number,
): HeatingCurvePoint[] {
  if (massKg <= 0) throw new Error('mass must be positive')
  if (startTempC > profile.meltingPointC) {
    throw new Error('start temperature must be at or below the melting point')
  }
  if (endTempC < profile.boilingPointC) {
    throw new Error('end temperature must be at or above the boiling point')
  }

  const points: HeatingCurvePoint[] = []
  let heat = 0

  points.push({ heatJ: round(heat), temperatureC: startTempC, phase: 'solid' })

  heat += massKg * profile.specificHeatSolid * (profile.meltingPointC - startTempC)
  points.push({ heatJ: round(heat), temperatureC: profile.meltingPointC, phase: 'solid' })

  heat += massKg * profile.latentHeatFusion
  points.push({ heatJ: round(heat), temperatureC: profile.meltingPointC, phase: 'melting' })

  heat += massKg * profile.specificHeatLiquid * (profile.boilingPointC - profile.meltingPointC)
  points.push({ heatJ: round(heat), temperatureC: profile.boilingPointC, phase: 'liquid' })

  heat += massKg * profile.latentHeatVaporization
  points.push({ heatJ: round(heat), temperatureC: profile.boilingPointC, phase: 'boiling' })

  heat += massKg * profile.specificHeatGas * (endTempC - profile.boilingPointC)
  points.push({ heatJ: round(heat), temperatureC: endTempC, phase: 'gas' })

  return points
}

/**
 * Temperature and phase at a given cumulative heat input, by linear
 * interpolation between the boundaries above — this is what a slider or an
 * animation plays back frame by frame.
 */
export function stateAtHeat(
  profile: SubstanceThermalProfile,
  massKg: number,
  startTempC: number,
  endTempC: number,
  heatJ: number,
): HeatingCurvePoint {
  const boundaries = heatingCurveBoundaries(profile, massKg, startTempC, endTempC)
  if (heatJ <= 0) return boundaries[0]
  const last = boundaries[boundaries.length - 1]
  if (heatJ >= last.heatJ) return last

  for (let i = 1; i < boundaries.length; i++) {
    const prev = boundaries[i - 1]
    const curr = boundaries[i]
    if (heatJ <= curr.heatJ) {
      if (curr.heatJ === prev.heatJ) {
        return { heatJ: round(heatJ), temperatureC: curr.temperatureC, phase: curr.phase }
      }
      const frac = (heatJ - prev.heatJ) / (curr.heatJ - prev.heatJ)
      const temp = prev.temperatureC + frac * (curr.temperatureC - prev.temperatureC)
      return { heatJ: round(heatJ), temperatureC: round(temp), phase: curr.phase }
    }
  }
  return last
}
