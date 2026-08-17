import { describe, it, expect } from 'vitest'
import {
  seriesResistance,
  parallelResistance,
  analyzeSeries,
  analyzeParallel,
} from './seriesParallel'

describe('seriesResistance — R = R1+R2+...+Rn, p. 315', () => {
  it('adds resistances directly', () => {
    expect(seriesResistance([1, 2])).toBe(3)
  })

  it('handles any number of resistors', () => {
    expect(seriesResistance([5, 10, 15])).toBe(30)
  })

  it('is always at least as large as the largest single resistor', () => {
    expect(seriesResistance([2, 3, 4])).toBeGreaterThan(4)
  })

  it('rejects an empty list or a non-positive resistance', () => {
    expect(() => seriesResistance([])).toThrow()
    expect(() => seriesResistance([1, 0])).toThrow()
  })
})

describe('parallelResistance — 1/R = 1/R1+1/R2+...+1/Rn, p. 317', () => {
  it('reproduces the book\'s own worked pair: 3 ohm and 6 ohm → 2 ohm', () => {
    expect(parallelResistance([3, 6])).toBe(2)
  })

  it('is always smaller than the smallest single resistor', () => {
    expect(parallelResistance([2, 3, 4])).toBeLessThan(2)
  })

  it('halves for two equal resistors', () => {
    expect(parallelResistance([10, 10])).toBeCloseTo(5, 6)
  })

  it('rejects an empty list or a non-positive resistance', () => {
    expect(() => parallelResistance([])).toThrow()
    expect(() => parallelResistance([1, 0])).toThrow()
  })
})

describe('analyzeSeries — p. 312-313 worked examples', () => {
  it('reproduces the book\'s own simple example: 3 V, 1 ohm + 2 ohm → I = 1 A', () => {
    const r = analyzeSeries(3, [1, 2])
    expect(r.equivalentOhm).toBe(3)
    expect(r.currentA).toBe(1)
    expect(r.voltageDropsV).toEqual([1, 2])
  })

  it('reproduces the book\'s own three-resistor example exactly: 6V, 5+10+15 ohm', () => {
    const r = analyzeSeries(6, [5, 10, 15])
    expect(r.currentA).toBeCloseTo(0.2, 6)
    expect(r.voltageDropsV[0]).toBeCloseTo(1, 6)
    expect(r.voltageDropsV[1]).toBeCloseTo(2, 6)
    expect(r.voltageDropsV[2]).toBeCloseTo(3, 6)
  })

  it('voltage drops sum back to the supply voltage', () => {
    const r = analyzeSeries(12, [2, 3, 5])
    const total = r.voltageDropsV.reduce((sum, v) => sum + v, 0)
    expect(total).toBeCloseTo(12, 6)
  })
})

describe('analyzeParallel — p. 313-314 worked example', () => {
  it('reproduces the book\'s own worked example exactly: 2V, 3 ohm ∥ 6 ohm', () => {
    const r = analyzeParallel(2, [3, 6])
    expect(r.equivalentOhm).toBe(2)
    expect(r.branchCurrentsA[0]).toBeCloseTo(2 / 3, 6)
    expect(r.branchCurrentsA[1]).toBeCloseTo(1 / 3, 6)
    expect(r.totalCurrentA).toBeCloseTo(1, 6)
  })

  it('branch currents sum to the total current', () => {
    const r = analyzeParallel(9, [3, 9, 6])
    const sum = r.branchCurrentsA.reduce((s, i) => s + i, 0)
    expect(sum).toBeCloseTo(r.totalCurrentA, 4)
  })
})
