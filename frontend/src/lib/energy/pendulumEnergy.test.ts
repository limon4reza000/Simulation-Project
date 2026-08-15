import { describe, it, expect } from 'vitest'
import { heightAtAngle, stateAtAngle, sampleSwing } from './pendulumEnergy'

describe('heightAtAngle — h = L(1 - cos θ)', () => {
  it('is zero straight down', () => {
    expect(heightAtAngle(1, 0)).toBe(0)
  })

  it('equals L at a horizontal swing (θ = 90°)', () => {
    expect(heightAtAngle(2, Math.PI / 2)).toBeCloseTo(2, 6)
  })

  it('is symmetric in sign — same height left or right of vertical', () => {
    expect(heightAtAngle(1.5, 0.4)).toBeCloseTo(heightAtAngle(1.5, -0.4), 6)
  })

  it('rejects a non-positive length', () => {
    expect(() => heightAtAngle(0, 0.5)).toThrow()
  })
})

describe('stateAtAngle — চিত্র ৪.০৪, energy conservation along the swing', () => {
  it('at the release point, all energy is potential and speed is zero', () => {
    const amplitude = 0.5
    const s = stateAtAngle(1, 1, amplitude, amplitude)
    expect(s.speed).toBeCloseTo(0, 6)
    expect(s.kinetic).toBeCloseTo(0, 6)
    expect(s.potential).toBeCloseTo(s.total, 6)
  })

  it('at the bottom (θ = 0), all energy is kinetic', () => {
    const s = stateAtAngle(1, 1, 0.6, 0)
    expect(s.potential).toBe(0)
    expect(s.kinetic).toBeCloseTo(s.total, 6)
  })

  it('total energy (T + V) is the same at every position — the figure\'s whole point', () => {
    const mass = 2
    const length = 1.2
    const amplitude = 0.7
    const total0 = stateAtAngle(mass, length, amplitude, amplitude).total
    for (const angle of [-0.7, -0.4, -0.1, 0, 0.2, 0.5, 0.7]) {
      expect(stateAtAngle(mass, length, amplitude, angle).total).toBeCloseTo(total0, 3)
    }
  })

  it('is symmetric: the same speed and energy split on either side of vertical', () => {
    const a = stateAtAngle(1, 1, 0.6, 0.3)
    const b = stateAtAngle(1, 1, 0.6, -0.3)
    expect(a.speed).toBeCloseTo(b.speed, 6)
    expect(a.kinetic).toBeCloseTo(b.kinetic, 6)
  })

  it('rejects an angle beyond the release amplitude', () => {
    expect(() => stateAtAngle(1, 1, 0.3, 0.5)).toThrow()
  })

  it('rejects non-positive mass or amplitude', () => {
    expect(() => stateAtAngle(0, 1, 0.3, 0)).toThrow()
    expect(() => stateAtAngle(1, 1, 0, 0)).toThrow()
  })
})

describe('sampleSwing', () => {
  it('starts and ends at the release amplitude, symmetric about zero', () => {
    const points = sampleSwing(1, 1, 0.5, 10)
    expect(points[0].angleRad).toBeCloseTo(-0.5, 6)
    expect(points[points.length - 1].angleRad).toBeCloseTo(0.5, 6)
  })

  it('rejects a non-positive step count', () => {
    expect(() => sampleSwing(1, 1, 0.5, 0)).toThrow()
  })
})
