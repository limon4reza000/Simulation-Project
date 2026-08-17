import { describe, it, expect } from 'vitest'
import {
  secondaryVoltage,
  secondaryCurrent,
  secondaryTurnsFromVoltages,
  transformerKind,
} from './transformer'

describe('secondaryVoltage — Vs = (ns/np)Vp, p. 341-342', () => {
  it('reproduces the book\'s own worked example exactly: 12V AC, 100->1000 turns -> 120V AC', () => {
    expect(secondaryVoltage(12, 100, 1000, true)).toBe(120)
  })

  it('reproduces the book\'s own point exactly: DC gives zero secondary voltage', () => {
    expect(secondaryVoltage(10, 100, 1000, false)).toBe(0)
  })

  it('equal turns gives equal voltage (isolation transformer)', () => {
    expect(secondaryVoltage(50, 20, 20, true)).toBe(50)
  })

  it('rejects non-positive turns', () => {
    expect(() => secondaryVoltage(12, 0, 1000, true)).toThrow()
  })
})

describe('secondaryCurrent — Is = (np/ns)Ip, p. 341-342', () => {
  it('reproduces the book\'s own worked example exactly: 1A primary, 100->1000 turns -> 0.1A secondary', () => {
    expect(secondaryCurrent(1, 100, 1000)).toBeCloseTo(0.1, 6)
  })

  it('a step-up transformer (more secondary turns) reduces current', () => {
    expect(secondaryCurrent(1, 100, 1000)).toBeLessThan(1)
  })

  it('a step-down transformer (fewer secondary turns) increases current', () => {
    expect(secondaryCurrent(1, 1000, 100)).toBeGreaterThan(1)
  })

  it('rejects non-positive turns', () => {
    expect(() => secondaryCurrent(1, 100, 0)).toThrow()
  })
})

describe('secondaryTurnsFromVoltages — সৃজনশীল MCQ, p. 344', () => {
  it('reproduces the sample-question fixture exactly: 200V->800V, np=100 -> ns=400', () => {
    expect(secondaryTurnsFromVoltages(100, 200, 800)).toBe(400)
  })

  it('reproduces the step-down fixture: 240V->8V, np=50 -> ns matches an 8/240 ratio', () => {
    const ns = secondaryTurnsFromVoltages(50, 240, 8)
    expect(ns).toBeCloseTo(50 * (8 / 240), 4)
  })

  it('rejects non-positive primary turns or voltage', () => {
    expect(() => secondaryTurnsFromVoltages(0, 200, 800)).toThrow()
    expect(() => secondaryTurnsFromVoltages(100, 0, 800)).toThrow()
  })
})

describe('transformerKind', () => {
  it('is step-up when secondary has more turns', () => {
    expect(transformerKind(100, 1000)).toBe('step-up')
  })

  it('is step-down when secondary has fewer turns', () => {
    expect(transformerKind(1000, 100)).toBe('step-down')
  })

  it('is isolation when turns are equal', () => {
    expect(transformerKind(50, 50)).toBe('isolation')
  })

  it('rejects non-positive turns', () => {
    expect(() => transformerKind(0, 100)).toThrow()
  })
})
