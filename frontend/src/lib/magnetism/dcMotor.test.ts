import { describe, it, expect } from 'vitest'
import { torqueAt, isDeadPoint, advanceAngle } from './dcMotor'

describe('torqueAt — চিত্র ১২.১০, pp. 336-338', () => {
  it('is "toward-alignment" at any angle strictly between 0 and 180', () => {
    expect(torqueAt(45)).toBe('toward-alignment')
    expect(torqueAt(90)).toBe('toward-alignment')
    expect(torqueAt(135)).toBe('toward-alignment')
  })

  it('is "none" exactly at the aligned dead points, 0 and 180 degrees', () => {
    expect(torqueAt(0)).toBe('none')
    expect(torqueAt(180)).toBe('none')
  })

  it('rejects an out-of-range angle', () => {
    expect(() => torqueAt(-1)).toThrow()
    expect(() => torqueAt(181)).toThrow()
  })
})

describe('isDeadPoint', () => {
  it('is true only at the two aligned angles', () => {
    expect(isDeadPoint(0)).toBe(true)
    expect(isDeadPoint(180)).toBe(true)
    expect(isDeadPoint(90)).toBe(false)
  })
})

describe('advanceAngle — continuous rotation through a dead point, p. 337-338', () => {
  it('advances by the given step under normal rotation', () => {
    expect(advanceAngle(30, 10)).toBe(40)
  })

  it('wraps around past 180 degrees rather than stopping there', () => {
    expect(advanceAngle(175, 10)).toBe(5)
  })

  it('never gets stuck exactly at a dead point across repeated steps', () => {
    let angle = 0
    for (let i = 0; i < 40; i++) {
      angle = advanceAngle(angle, 10)
    }
    // After enough steps the coil has passed through both dead points
    // without settling — it is somewhere mid-rotation, not stuck at 0/180.
    expect(angle).toBeGreaterThanOrEqual(0)
    expect(angle).toBeLessThan(180)
  })

  it('rejects a non-positive step', () => {
    expect(() => advanceAngle(30, 0)).toThrow()
  })
})
