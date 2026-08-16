import { describe, it, expect } from 'vitest'
import { chargeStored, voltageFromCharge, storedEnergy } from './capacitor'

describe('chargeStored / voltageFromCharge — Q = CV, p. 289', () => {
  it('round-trips', () => {
    const Q = chargeStored(20e-6, 10)
    expect(voltageFromCharge(Q, 20e-6)).toBeCloseTo(10, 4)
  })

  it('rejects non-positive capacitance', () => {
    expect(() => chargeStored(0, 10)).toThrow()
    expect(() => voltageFromCharge(1, 0)).toThrow()
  })
})

describe('storedEnergy — energy = ½CV², p. 290', () => {
  it('reproduces the book\'s own worked example exactly: 20 µF at 10 V → 1 mJ', () => {
    expect(storedEnergy(20e-6, 10)).toBeCloseTo(1e-3, 9)
  })

  it('quadruples when voltage doubles', () => {
    const e1 = storedEnergy(10e-6, 5)
    const e2 = storedEnergy(10e-6, 10)
    expect(e2).toBeCloseTo(4 * e1, 9)
  })

  it('doubles when capacitance doubles at fixed voltage', () => {
    const e1 = storedEnergy(10e-6, 5)
    const e2 = storedEnergy(20e-6, 5)
    expect(e2).toBeCloseTo(2 * e1, 9)
  })

  it('rejects non-positive capacitance', () => {
    expect(() => storedEnergy(0, 10)).toThrow()
  })
})
