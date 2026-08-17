import { describe, it, expect } from 'vitest'
import {
  classifyDopant,
  chargeCarrierFor,
  NAMED_DOPANTS,
} from './semiconductorDoping'

describe('classifyDopant — p. 357-358', () => {
  it('reproduces the book\'s own example: phosphorus (5 valence electrons) -> n-type', () => {
    expect(classifyDopant(5)).toBe('n-type')
  })

  it('reproduces the book\'s own example: boron (3 valence electrons) -> p-type', () => {
    expect(classifyDopant(3)).toBe('p-type')
  })

  it('silicon itself (4 valence electrons) is intrinsic — no doping effect', () => {
    expect(classifyDopant(4)).toBe('intrinsic')
  })

  it('rejects a non-integer or out-of-range valence count', () => {
    expect(() => classifyDopant(4.5)).toThrow()
    expect(() => classifyDopant(0)).toThrow()
    expect(() => classifyDopant(8)).toThrow()
  })
})

describe('chargeCarrierFor — p. 358', () => {
  it('phosphorus gives a free electron', () => {
    expect(chargeCarrierFor(5)).toBe('free electron')
  })

  it('boron gives a hole', () => {
    expect(chargeCarrierFor(3)).toBe('hole')
  })

  it('undoped silicon gives no mobile carrier', () => {
    expect(chargeCarrierFor(4)).toBe('none')
  })
})

describe('NAMED_DOPANTS', () => {
  it('reproduces the book\'s own two named dopants plus the silicon baseline', () => {
    expect(NAMED_DOPANTS.map((d) => d.key)).toEqual(['phosphorus', 'boron', 'silicon'])
  })

  it('each named dopant classifies consistently with its own valence count', () => {
    expect(classifyDopant(NAMED_DOPANTS[0].valenceElectrons)).toBe('n-type')
    expect(classifyDopant(NAMED_DOPANTS[1].valenceElectrons)).toBe('p-type')
    expect(classifyDopant(NAMED_DOPANTS[2].valenceElectrons)).toBe('intrinsic')
  })
})
