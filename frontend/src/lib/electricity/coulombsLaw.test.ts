import { describe, it, expect } from 'vitest'
import { coulombForce, equilibriumPoint } from './coulombsLaw'

describe('coulombForce — F = kq1q2/r², p. 280-281', () => {
  it('reproduces the book\'s own worked example exactly: +1 C and -1 C at 10 cm', () => {
    expect(coulombForce(1, -1, 0.1)).toBeCloseTo(-9e11, -6)
  })

  it('reproduces the book\'s own worked example exactly: hydrogen atom, p. 282', () => {
    const F = coulombForce(1.6e-19, -1.6e-19, 0.5e-8)
    expect(F).toBeCloseTo(-9.22e-12, 13)
  })

  it('is positive (repulsive) for two like charges', () => {
    expect(coulombForce(2, 3, 1)).toBeGreaterThan(0)
  })

  it('is negative (attractive) for two unlike charges', () => {
    expect(coulombForce(2, -3, 1)).toBeLessThan(0)
  })

  it('follows the inverse-square law', () => {
    const f1 = coulombForce(1, 1, 1)
    const f2 = coulombForce(1, 1, 2)
    expect(f1).toBeCloseTo(4 * f2, 6)
  })

  it('rejects a non-positive separation', () => {
    expect(() => coulombForce(1, 1, 0)).toThrow()
  })
})

describe('equilibriumPoint — three-charge problem, p. 281', () => {
  it('reproduces the book\'s own worked example exactly: +9 C and +16 C, 1 m apart → x = 0.43 m', () => {
    expect(equilibriumPoint(9, 16, 1)).toBeCloseTo(0.43, 2)
  })

  it('sits exactly at the midpoint for two equal charges', () => {
    expect(equilibriumPoint(5, 5, 2)).toBeCloseTo(1, 6)
  })

  it('sits closer to the smaller charge', () => {
    const x = equilibriumPoint(4, 16, 1)
    expect(x).toBeLessThan(0.5)
  })

  it('scales linearly with separation', () => {
    expect(equilibriumPoint(9, 16, 2)).toBeCloseTo(2 * equilibriumPoint(9, 16, 1), 5)
  })

  it('rejects non-positive charges or separation', () => {
    expect(() => equilibriumPoint(0, 16, 1)).toThrow()
    expect(() => equilibriumPoint(-9, 16, 1)).toThrow()
    expect(() => equilibriumPoint(9, 16, 0)).toThrow()
  })
})
