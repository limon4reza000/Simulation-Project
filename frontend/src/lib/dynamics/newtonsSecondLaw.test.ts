import { describe, it, expect } from 'vitest'
import {
  acceleration,
  stateAtTime,
  sampleMotion,
  forceFromMomentumChange,
} from './newtonsSecondLaw'

/**
 * Expected values follow directly from the book's own statement of the law,
 * F = ma (§৩.৬, p. 76), and from its derivation via momentum change
 * (rate of change of momentum = ma).
 */

describe('acceleration — a = F/m', () => {
  it('10 N on a 2 kg mass gives 5 m/s²', () => {
    expect(acceleration(10, 2)).toBe(5)
  })

  it('doubling the force doubles the acceleration for fixed mass', () => {
    expect(acceleration(20, 2)).toBe(2 * acceleration(10, 2))
  })

  it('doubling the mass halves the acceleration for fixed force', () => {
    expect(acceleration(10, 4)).toBe(acceleration(10, 2) / 2)
  })

  it('zero force gives zero acceleration', () => {
    expect(acceleration(0, 5)).toBe(0)
  })

  it('rejects non-positive mass', () => {
    expect(() => acceleration(10, 0)).toThrow()
    expect(() => acceleration(10, -2)).toThrow()
  })
})

describe('stateAtTime — a body starting from rest under constant force', () => {
  it('at t = 0, velocity and displacement are both zero', () => {
    const s = stateAtTime(10, 2, 0)
    expect(s.velocity).toBe(0)
    expect(s.displacement).toBe(0)
  })

  it('v = at directly: 5 m/s² for 2 s gives 10 m/s', () => {
    expect(stateAtTime(10, 2, 2).velocity).toBe(10)
  })

  it('s = ½at²: 5 m/s² for 2 s gives 10 m', () => {
    expect(stateAtTime(10, 2, 2).displacement).toBe(10)
  })

  it('momentum change equals mv, matching the book’s own definition of F·t', () => {
    // Rearranged, the book's F = Δp/t means Δp = F·t.
    const force = 10
    const mass = 2
    const time = 3
    const s = stateAtTime(force, mass, time)
    expect(s.momentumChange).toBeCloseTo(force * time, 6)
  })

  it('rejects negative time', () => {
    expect(() => stateAtTime(10, 2, -1)).toThrow()
  })
})

describe('sampleMotion', () => {
  it('starts at rest and matches stateAtTime at the final point', () => {
    const points = sampleMotion(10, 2, 4, 8)
    expect(points).toHaveLength(9)
    expect(points[0].velocity).toBe(0)
    expect(points[points.length - 1].velocity).toBeCloseTo(
      stateAtTime(10, 2, 4).velocity,
      6,
    )
  })

  it('is monotonically increasing in velocity for a positive force', () => {
    const points = sampleMotion(6, 3, 5, 10)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].velocity).toBeGreaterThan(points[i - 1].velocity)
    }
  })

  it('is flat at zero for zero force', () => {
    const points = sampleMotion(0, 3, 5, 5)
    for (const p of points) expect(p.velocity).toBe(0)
  })

  it('rejects a non-positive step count', () => {
    expect(() => sampleMotion(10, 2, 4, 0)).toThrow()
  })
})

describe('forceFromMomentumChange — F = Δp/t, the book’s law run in reverse', () => {
  it('agrees with stateAtTime’s own momentum change for the same force', () => {
    const force = 10
    const mass = 2
    const time = 3
    const s = stateAtTime(force, mass, time)
    expect(forceFromMomentumChange(s.momentumChange, time)).toBeCloseTo(force, 6)
  })

  it('rejects non-positive time', () => {
    expect(() => forceFromMomentumChange(10, 0)).toThrow()
  })
})
