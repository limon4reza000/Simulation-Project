import { describe, it, expect } from 'vitest'
import { power, climbingPower, efficiency } from './powerEfficiency'

describe('power — P = W/t, p. 120', () => {
  it('1 J per second is 1 W, the book\'s own definition of the unit', () => {
    expect(power(1, 1)).toBe(1)
  })

  it('a 100 W bulb converts 100 J every second, as the book states directly', () => {
    expect(power(100, 1)).toBe(100)
  })

  it('rejects non-positive time', () => {
    expect(() => power(10, 0)).toThrow()
  })
})

describe('climbingPower — অনুসন্ধান ৪.০১, p. 122', () => {
  it('computes P = mgh/t for a plausible stair-climb', () => {
    // 50 kg student climbs 6 m (two floors at 3 m) in 8 s.
    const p = climbingPower(50, 6, 8)
    expect(p).toBeCloseTo((50 * 9.8 * 6) / 8, 6)
  })

  it('rejects non-positive mass or negative height', () => {
    expect(() => climbingPower(0, 6, 8)).toThrow()
    expect(() => climbingPower(50, -1, 8)).toThrow()
  })
})

describe('efficiency — §৪.৮, p. 121', () => {
  it('reproduces the book\'s own worked example exactly', () => {
    // 1000 W motor, 15 s, lifts 100 kg by 10 m.
    const r = efficiency(1000, 15, 100, 10)
    expect(r.workDone).toBe(9800)
    expect(r.energySupplied).toBe(15000)
    expect(r.loss).toBe(5200)
    expect(r.efficiencyPercent).toBeCloseTo(65.3, 1)
  })

  it('is 100% when no energy is lost', () => {
    // A motor supplying exactly mgh over the time it runs.
    const massKg = 10
    const heightM = 5
    const timeS = 2
    const workJ = massKg * 9.8 * heightM
    const motorPowerW = workJ / timeS
    const r = efficiency(motorPowerW, timeS, massKg, heightM)
    expect(r.efficiencyPercent).toBeCloseTo(100, 1)
    expect(r.loss).toBeCloseTo(0, 6)
  })

  it('rejects non-positive motor power, time or mass', () => {
    expect(() => efficiency(0, 1, 1, 1)).toThrow()
    expect(() => efficiency(10, 0, 1, 1)).toThrow()
    expect(() => efficiency(10, 1, 0, 1)).toThrow()
  })
})
