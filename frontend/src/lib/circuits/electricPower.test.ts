import { describe, it, expect } from 'vitest'
import {
  powerFromVI,
  powerFromIR,
  powerFromVR,
  electricityBill,
} from './electricPower'

describe('powerFromVI / powerFromIR / powerFromVR — P = VI = I²R = V²/R, pp. 317-318', () => {
  it('all three forms agree for the same circuit', () => {
    const V = 12
    const R = 4
    const I = V / R
    const p1 = powerFromVI(V, I)
    const p2 = powerFromIR(I, R)
    const p3 = powerFromVR(V, R)
    expect(p1).toBeCloseTo(p2, 6)
    expect(p2).toBeCloseTo(p3, 6)
    expect(p1).toBeCloseTo(36, 6)
  })

  it('powerFromIR rejects non-positive resistance', () => {
    expect(() => powerFromIR(1, 0)).toThrow()
  })

  it('powerFromVR rejects non-positive resistance', () => {
    expect(() => powerFromVR(1, 0)).toThrow()
  })
})

describe('electricityBill — §১১.৩ worked example, p. 319', () => {
  it('reproduces the book\'s own worked example exactly: 60 W, 5 h/day, 30 days, ৳10/unit', () => {
    const bill = electricityBill(60, 5, 30, 10)
    expect(bill.units).toBe(9)
    expect(bill.costTaka).toBe(90)
  })

  it('doubling daily usage doubles both units and cost', () => {
    const a = electricityBill(60, 5, 30, 10)
    const b = electricityBill(60, 10, 30, 10)
    expect(b.units).toBeCloseTo(2 * a.units, 6)
    expect(b.costTaka).toBeCloseTo(2 * a.costTaka, 6)
  })

  it('rejects non-positive power or negative hours/days/price', () => {
    expect(() => electricityBill(0, 5, 30, 10)).toThrow()
    expect(() => electricityBill(60, -1, 30, 10)).toThrow()
    expect(() => electricityBill(60, 5, -1, 10)).toThrow()
    expect(() => electricityBill(60, 5, 30, -1)).toThrow()
  })
})
