import { describe, it, expect } from 'vitest'
import { work, workAgainstFriction, workAgainstGravity } from './work'

describe('work — W = Fs, §৪.১', () => {
  it('is positive when force and displacement agree', () => {
    expect(work(100, 10)).toBe(1000)
  })

  it('is negative for a force applied against a displacement', () => {
    expect(work(-10, 10)).toBe(-100)
  })

  it('is zero for zero displacement — no motion, no work, however hard you push', () => {
    expect(work(500, 0)).toBe(0)
  })
})

describe('workAgainstFriction — চিত্র ৪.০১, p. 103', () => {
  it('reproduces the book\'s own worked example exactly: 100 N over 10 m against 10 N friction', () => {
    const r = workAgainstFriction(100, 10, 10)
    expect(r.appliedWork).toBe(1000)
    expect(r.frictionWork).toBe(-100)
    expect(r.netWork).toBe(900)
  })

  it('rejects a negative friction force', () => {
    expect(() => workAgainstFriction(100, -5, 10)).toThrow()
  })

  it('with zero friction, net work equals applied work', () => {
    const r = workAgainstFriction(50, 0, 4)
    expect(r.netWork).toBe(r.appliedWork)
  })
})

describe('workAgainstGravity — p. 101, climbing a 10-storey building', () => {
  it('reproduces the book\'s own worked example: 50 kg, 30 m → 14,700 J', () => {
    // The book uses g = 9.8, so 50 * 9.8 * 30 = 14,700 J = 14.7 kJ.
    expect(workAgainstGravity(50, 30)).toBe(14700)
  })

  it('scales linearly with height', () => {
    expect(workAgainstGravity(50, 60)).toBe(2 * workAgainstGravity(50, 30))
  })

  it('rejects non-positive mass or negative height', () => {
    expect(() => workAgainstGravity(0, 10)).toThrow()
    expect(() => workAgainstGravity(10, -1)).toThrow()
  })
})
