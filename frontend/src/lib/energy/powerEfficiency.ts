/**
 * Power and efficiency.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §৪.৭ ক্ষমতা
 * (Power), p. 120, §৪.৮ কর্মদক্ষতা (Efficiency), p. 121, and অনুসন্ধান ৪.০১
 * শারীরিক ক্ষমতা (Physical Power investigation), p. 122.
 *
 * The book defines power as the rate of doing work, P = W/t (p. 120), then
 * immediately reframes it as the rate of energy transformation — the same
 * thing, since work and energy transformation are the same act (§৪.২).
 * Efficiency (p. 121) compares the useful work actually done against the
 * energy supplied to do it: η = (কাজের পরিমাণ / প্রদত্ত শক্তি) × 100%, and the
 * book's own investigation (p. 122) is a direct physical measurement of a
 * student's own power: climb a flight of known height, time it, and compute
 * P = mgh/t.
 *
 * No React — pure arithmetic, reused by the renderer and directly testable
 * against the book's own worked example (a 1000 W motor lifting 100 kg by
 * 10 m in 15 s → η = 65.3 %).
 */

const G = 9.8

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** P = W/t, the book's definition (p. 120). */
export function power(workJ: number, timeS: number): number {
  if (timeS <= 0) throw new Error('time must be positive')
  return round(workJ / timeS)
}

/**
 * Power exerted climbing to height h in time t — অনুসন্ধান ৪.০১'s own
 * formula (p. 122): P = mgh/t.
 */
export function climbingPower(massKg: number, heightM: number, timeS: number, g = G): number {
  if (massKg <= 0) throw new Error('mass must be positive')
  if (heightM < 0) throw new Error('height must be non-negative')
  return power(massKg * g * heightM, timeS)
}

export interface EfficiencyResult {
  workDone: number
  energySupplied: number
  loss: number
  /** As a percentage, matching the book's own %-form answer (p. 121). */
  efficiencyPercent: number
}

/**
 * η = (work done / energy supplied) × 100 %, and the loss that accounts for
 * the shortfall (p. 121) — a motor rated at some power, run for some time,
 * supplies more energy than the useful work it manages to do; the rest is
 * lost, mostly to heat.
 */
export function efficiency(
  motorPowerW: number,
  timeS: number,
  massKg: number,
  heightM: number,
  g = G,
): EfficiencyResult {
  if (motorPowerW <= 0) throw new Error('motor power must be positive')
  if (timeS <= 0) throw new Error('time must be positive')
  if (massKg <= 0) throw new Error('mass must be positive')
  if (heightM < 0) throw new Error('height must be non-negative')
  const workDone = round(massKg * g * heightM)
  const energySupplied = round(motorPowerW * timeS)
  const loss = round(energySupplied - workDone)
  const efficiencyPercent = round((workDone / energySupplied) * 100, 1)
  return { workDone, energySupplied, loss, efficiencyPercent }
}
