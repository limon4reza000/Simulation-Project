import { describe, it, expect } from 'vitest'
import { liquidPressure, atmospheresFromDepth, depthForOneAtm } from './liquidPressure'

describe('liquidPressure — P = hρg, p. 134', () => {
  it('reproduces the book\'s own worked example: kerosene at 0.5 m → 3,920 N/m²', () => {
    expect(liquidPressure(0.5, 800)).toBeCloseTo(3920, 6)
  })

  it('reproduces the book\'s own worked example: water at 0.5 m → 4,900 N/m²', () => {
    expect(liquidPressure(0.5, 1000)).toBeCloseTo(4900, 6)
  })

  it('reproduces the book\'s own worked example: mercury at 0.5 m → 66,640 N/m²', () => {
    expect(liquidPressure(0.5, 13600)).toBeCloseTo(66640, 6)
  })

  it('is zero at the surface', () => {
    expect(liquidPressure(0, 1000)).toBe(0)
  })

  it('rejects negative depth or non-positive density', () => {
    expect(() => liquidPressure(-1, 1000)).toThrow()
    expect(() => liquidPressure(1, 0)).toThrow()
  })
})

describe('atmospheresFromDepth — the book\'s 10 m/atm rule, pp. 135–136', () => {
  it('reproduces the book\'s own worked example: whale at 2,100 m → 210 atm', () => {
    expect(atmospheresFromDepth(2100)).toBe(210)
  })

  it('reproduces the book\'s own worked example: diver at 305 m → 30.5 atm', () => {
    expect(atmospheresFromDepth(305)).toBe(30.5)
  })

  it('rejects negative depth', () => {
    expect(() => atmospheresFromDepth(-1)).toThrow()
  })
})

describe('depthForOneAtm — p. 136, comparing three named liquids', () => {
  it('reproduces mercury\'s own reference depth: 76 cm', () => {
    expect(depthForOneAtm(13600)).toBeCloseTo(0.76, 2)
  })

  it('reproduces water\'s depth: 10.34 m', () => {
    expect(depthForOneAtm(1000)).toBeCloseTo(10.34, 2)
  })

  it('reproduces kerosene\'s depth: 12.92 m', () => {
    expect(depthForOneAtm(800)).toBeCloseTo(12.92, 2)
  })

  it('a denser liquid needs less depth to reach 1 atm', () => {
    expect(depthForOneAtm(13600)).toBeLessThan(depthForOneAtm(1000))
  })
})
