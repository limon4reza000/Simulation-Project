/**
 * The fundamental principle of calorimetry: heat lost equals heat gained.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৬.৫ আপেক্ষিক তাপ,
 * pp. 178–179, and §৬.৬ ক্যালোরিমিতির মূলনীতি, pp. 179–181.
 *
 * The book states two rules explicitly (p. 179): (i) the hotter body gives
 * heat to the cooler one until their temperatures are equal, and (ii)
 * whatever heat the hotter body loses, the cooler body gains exactly that
 * much (no heat lost to the surroundings). It then works three examples from
 * those two rules: ice melting in warm water, two masses of water mixing,
 * and a small hot mass of iron dropped into a much larger mass of water.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against all three worked examples.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export interface Body {
  massKg: number
  specificHeatJKgK: number
  tempC: number
}

/**
 * Final equilibrium temperature of two bodies brought into contact, from
 * m1 s1 (T1 - T) = m2 s2 (T - T2) rearranged for T (p. 179, p. 181's
 * water-water and iron-water examples both use exactly this form).
 */
export function finalTemperature(a: Body, b: Body): number {
  if (a.massKg <= 0 || b.massKg <= 0) throw new Error('mass must be positive')
  if (a.specificHeatJKgK <= 0 || b.specificHeatJKgK <= 0) {
    throw new Error('specific heat must be positive')
  }
  const numerator = a.massKg * a.specificHeatJKgK * a.tempC + b.massKg * b.specificHeatJKgK * b.tempC
  const denominator = a.massKg * a.specificHeatJKgK + b.massKg * b.specificHeatJKgK
  return round(numerator / denominator, 4)
}

/**
 * Final equilibrium temperature when ice at 0°C is dropped into warm water,
 * from the book's own worked example (p. 180): the ice first absorbs its
 * latent heat of fusion to become 0°C water, then that meltwater and the
 * original water share the remaining heat by the ordinary calorimetry
 * relation. Throws if there is not enough heat in the water to fully melt
 * the ice — that case (a final mix of ice and water at 0°C) is a different,
 * unprinted problem this module does not model.
 */
export function finalTemperatureWithMeltingIce(
  iceMassKg: number,
  waterMassKg: number,
  waterTempC: number,
  latentHeatFusionJKg: number,
  specificHeatWaterJKgK: number,
): number {
  if (iceMassKg <= 0 || waterMassKg <= 0) throw new Error('mass must be positive')
  if (waterTempC <= 0) throw new Error('water must start above 0°C to melt the ice')
  const heatToMeltIce = iceMassKg * latentHeatFusionJKg
  const heatAvailable = waterMassKg * specificHeatWaterJKgK * waterTempC
  if (heatAvailable <= heatToMeltIce) {
    throw new Error('not enough heat in the water to fully melt the ice')
  }
  // m1*L + m1*s*T = m2*s*(Tw - T), the book's own derivation (p. 180), solved for T.
  return round(
    (waterMassKg * specificHeatWaterJKgK * waterTempC - heatToMeltIce) /
      ((iceMassKg + waterMassKg) * specificHeatWaterJKgK),
    4,
  )
}

/** Heat released or absorbed by a body cooling/warming from tempC to finalC. */
export function heatExchanged(body: Body, finalC: number): number {
  if (body.massKg <= 0) throw new Error('mass must be positive')
  if (body.specificHeatJKgK <= 0) throw new Error('specific heat must be positive')
  return round(body.massKg * body.specificHeatJKgK * (finalC - body.tempC))
}
