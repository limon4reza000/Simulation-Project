/**
 * Kinetic and potential energy, and their exchange for a body under gravity
 * alone.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৪.৩.১ গতিশক্তি
 * (pp. 104–105) and §৪.৩.২ বিভব শক্তি (pp. 106–109).
 *
 * The book derives T = ½mv² from F = ma and the equations of motion
 * (p. 104), derives gravitational potential energy as V = mgh (p. 108), and
 * then re-derives v² = 2gh a *second* time — not from kinematics this time,
 * but purely from energy conservation (½mv² = mgh) — calling out explicitly
 * that it is "হুবহু" (exactly) the same relation reached a different way
 * (p. 109). This module models a body thrown straight up at speed u: its
 * energy trades between kinetic and potential as height changes, total held
 * fixed, exactly the relation the book proves twice.
 *
 * No React — pure physics, reused by the renderer and directly testable
 * against the book's own worked example (a 10 kg body at 100 m/s rises
 * 510 m, p. 109).
 */

const G = 9.8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** T = ½mv² (p. 104). */
export function kineticEnergy(massKg: number, speedMs: number): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  return round(0.5 * massKg * speedMs * speedMs)
}

/** V = mgh (p. 108). */
export function potentialEnergy(massKg: number, heightM: number, g = G): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  return round(massKg * g * heightM)
}

/**
 * The greatest height a body thrown upward at speed u reaches — the book's
 * own energy-conservation route (p. 109): all of ½mu² becomes mgh at the top,
 * where v = 0. Mass cancels, exactly as the book points out.
 */
export function maxHeight(launchSpeedMs: number, g = G): number {
  if (launchSpeedMs < 0) throw new Error('speed must be non-negative')
  return round((launchSpeedMs * launchSpeedMs) / (2 * g))
}

export interface EnergyState {
  height: number
  speed: number
  kinetic: number
  potential: number
  total: number
}

/**
 * State of a body launched straight up at `launchSpeedMs`, at height `h`
 * along that same vertical line (0 ≤ h ≤ the max height it reaches).
 * Speed is recovered from energy conservation itself (v² = u² - 2gh), the
 * same identity the book proves both by kinematics and by energy — so this
 * function IS that proof, not a restatement of it.
 */
export function stateAtHeight(
  massKg: number,
  launchSpeedMs: number,
  heightM: number,
  g = G,
): EnergyState {
  if (massKg <= 0) throw new Error('mass must be positive')
  const peak = maxHeight(launchSpeedMs, g)
  if (heightM < 0 || heightM > peak + 1e-9) {
    throw new Error('height must lie between 0 and the body\'s max height')
  }
  const speedSq = Math.max(0, launchSpeedMs * launchSpeedMs - 2 * g * heightM)
  const speed = Math.sqrt(speedSq)
  const kinetic = kineticEnergy(massKg, speed)
  const potential = potentialEnergy(massKg, heightM, g)
  return {
    height: round(heightM),
    speed: round(speed),
    kinetic,
    potential,
    total: round(kinetic + potential),
  }
}
