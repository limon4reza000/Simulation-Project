/**
 * Archimedes' principle, buoyancy, and floating/sinking.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৫.৩.১ আর্কিমিডিসের
 * নীতি এবং প্লবতা, pp. 137–138, and §৫.৩.২ বস্তুর ভেসে থাকা বা ডুবে যাওয়া,
 * pp. 138–140.
 *
 * The book derives F = Ahρg — the buoyant force on a submerged cylinder — as
 * the difference between the upward pressure on its bottom face and the
 * downward pressure on its top face (p. 137–138), and notes Ah is exactly the
 * cylinder's volume, so F is the weight of the fluid it displaces: this is
 * Archimedes' principle. §৫.৩.২ then derives the floating fraction directly:
 * an object floats with just enough of itself submerged that the displaced
 * fluid's weight equals the object's own weight, so
 * V_submerged / V_object = ρ_object / ρ_fluid — independent of the object's
 * total volume or shape.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own worked examples: wood floating 50% submerged in
 * water and 48.5% in sea water, and the Archimedes crown problem.
 */

const G = 9.8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** F = Ahρg = (volume)ρg — the weight of fluid displaced (p. 138). */
export function buoyantForce(volumeM3: number, fluidDensityKgM3: number, g = G): number {
  if (volumeM3 <= 0) throw new Error('volume must be positive')
  if (fluidDensityKgM3 <= 0) throw new Error('fluid density must be positive')
  return round(volumeM3 * fluidDensityKgM3 * g)
}

/**
 * Fraction of an object's volume submerged when floating in equilibrium
 * (p. 139): ρ_object / ρ_fluid. Values ≥ 1 mean the object sinks entirely
 * (there is no floating equilibrium), which the book does not need to state
 * explicitly since it only asks about objects that do float.
 */
export function submergedFraction(objectDensityKgM3: number, fluidDensityKgM3: number): number {
  if (objectDensityKgM3 <= 0) throw new Error('object density must be positive')
  if (fluidDensityKgM3 <= 0) throw new Error('fluid density must be positive')
  return round(objectDensityKgM3 / fluidDensityKgM3)
}

/** Whether an object floats at all (submerged fraction < 1) rather than sinking outright. */
export function floats(objectDensityKgM3: number, fluidDensityKgM3: number): boolean {
  return submergedFraction(objectDensityKgM3, fluidDensityKgM3) < 1
}

/**
 * Archimedes' own crown problem (p. 140): an object weighs `massInAirKg` in
 * air and has an apparent mass of `massSubmergedKg` when fully submerged in a
 * fluid of the given density. The mass "lost" equals the mass of fluid
 * displaced, which gives the object's volume, and from volume and its true
 * mass (massInAirKg — buoyancy does not change how much matter is there),
 * its density.
 */
export function densityFromApparentLoss(
  massInAirKg: number,
  massSubmergedKg: number,
  fluidDensityKgM3: number,
): number {
  if (massInAirKg <= 0) throw new Error('mass in air must be positive')
  if (massSubmergedKg < 0) throw new Error('submerged mass must be non-negative')
  if (massSubmergedKg >= massInAirKg) {
    throw new Error('submerged mass must be less than mass in air for a sinking object')
  }
  if (fluidDensityKgM3 <= 0) throw new Error('fluid density must be positive')
  const massLostKg = massInAirKg - massSubmergedKg
  const volumeM3 = massLostKg / fluidDensityKgM3
  return round(massInAirKg / volumeM3)
}
