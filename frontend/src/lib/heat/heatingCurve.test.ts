import { describe, it, expect } from 'vitest'
import { heatingCurveBoundaries, stateAtHeat, WATER } from './heatingCurve'

describe('heatingCurveBoundaries — চিত্র ৬.০৮ shape, pp. 175-177', () => {
  it('produces exactly 6 boundary points: start, melt-start, melt-end, boil-start, boil-end, end', () => {
    const points = heatingCurveBoundaries(WATER, 1, -20, 120)
    expect(points.length).toBe(6)
  })

  it('temperature holds flat at the melting point across the melting segment', () => {
    const points = heatingCurveBoundaries(WATER, 1, -20, 120)
    const meltStart = points[1]
    const meltEnd = points[2]
    expect(meltStart.temperatureC).toBe(0)
    expect(meltEnd.temperatureC).toBe(0)
    expect(meltEnd.heatJ).toBeGreaterThan(meltStart.heatJ)
  })

  it('temperature holds flat at the boiling point across the boiling segment', () => {
    const points = heatingCurveBoundaries(WATER, 1, -20, 120)
    const boilStart = points[3]
    const boilEnd = points[4]
    expect(boilStart.temperatureC).toBe(100)
    expect(boilEnd.temperatureC).toBe(100)
    expect(boilEnd.heatJ).toBeGreaterThan(boilStart.heatJ)
  })

  it('cumulative heat only ever increases along the curve', () => {
    const points = heatingCurveBoundaries(WATER, 1, -20, 120)
    for (let i = 1; i < points.length; i++) {
      expect(points[i].heatJ).toBeGreaterThanOrEqual(points[i - 1].heatJ)
    }
  })

  it('a larger mass needs more heat to reach the same boundaries', () => {
    const small = heatingCurveBoundaries(WATER, 1, -20, 120)
    const large = heatingCurveBoundaries(WATER, 2, -20, 120)
    expect(large[large.length - 1].heatJ).toBeCloseTo(2 * small[small.length - 1].heatJ, 3)
  })

  it('rejects a start temperature above the melting point or an end temperature below the boiling point', () => {
    expect(() => heatingCurveBoundaries(WATER, 1, 10, 120)).toThrow()
    expect(() => heatingCurveBoundaries(WATER, 1, -20, 50)).toThrow()
  })

  it('rejects non-positive mass', () => {
    expect(() => heatingCurveBoundaries(WATER, 0, -20, 120)).toThrow()
  })
})

describe('stateAtHeat — reading the curve back at a given heat input', () => {
  it('is the start state at zero heat', () => {
    const s = stateAtHeat(WATER, 1, -20, 120, 0)
    expect(s.temperatureC).toBe(-20)
    expect(s.phase).toBe('solid')
  })

  it('is the end state at or beyond the total heat required', () => {
    const boundaries = heatingCurveBoundaries(WATER, 1, -20, 120)
    const total = boundaries[boundaries.length - 1].heatJ
    const s = stateAtHeat(WATER, 1, -20, 120, total + 1000)
    expect(s.temperatureC).toBe(120)
    expect(s.phase).toBe('gas')
  })

  it('reports "melting" phase with 0°C partway through the melting plateau', () => {
    const boundaries = heatingCurveBoundaries(WATER, 1, -20, 120)
    const midMelt = (boundaries[1].heatJ + boundaries[2].heatJ) / 2
    const s = stateAtHeat(WATER, 1, -20, 120, midMelt)
    expect(s.temperatureC).toBe(0)
    expect(s.phase).toBe('melting')
  })

  it('reports "boiling" phase with 100°C partway through the boiling plateau', () => {
    const boundaries = heatingCurveBoundaries(WATER, 1, -20, 120)
    const midBoil = (boundaries[3].heatJ + boundaries[4].heatJ) / 2
    const s = stateAtHeat(WATER, 1, -20, 120, midBoil)
    expect(s.temperatureC).toBe(100)
    expect(s.phase).toBe('boiling')
  })

  it('temperature rises smoothly (interpolated) within the solid-heating segment', () => {
    const boundaries = heatingCurveBoundaries(WATER, 1, -20, 120)
    const quarter = boundaries[1].heatJ / 4
    const s = stateAtHeat(WATER, 1, -20, 120, quarter)
    expect(s.temperatureC).toBeGreaterThan(-20)
    expect(s.temperatureC).toBeLessThan(0)
    expect(s.phase).toBe('solid')
  })
})
