import { describe, it, expect } from 'vitest'
import { decimalToBinary, binaryToDecimal, bitsFor } from './binaryConverter'

describe('decimalToBinary / binaryToDecimal — §১৩.৩, pp. 356-357', () => {
  it('converts familiar small values correctly', () => {
    expect(decimalToBinary(0)).toBe('0')
    expect(decimalToBinary(1)).toBe('1')
    expect(decimalToBinary(2)).toBe('10')
    expect(decimalToBinary(10)).toBe('1010')
    expect(decimalToBinary(255)).toBe('11111111')
  })

  it('round-trips for a range of values', () => {
    for (const n of [0, 1, 7, 42, 100, 1023]) {
      expect(binaryToDecimal(decimalToBinary(n))).toBe(n)
    }
  })

  it('binaryToDecimal reproduces familiar values', () => {
    expect(binaryToDecimal('1010')).toBe(10)
    expect(binaryToDecimal('11111111')).toBe(255)
  })

  it('rejects a negative or non-integer decimal', () => {
    expect(() => decimalToBinary(-1)).toThrow()
    expect(() => decimalToBinary(1.5)).toThrow()
  })

  it('rejects a binary string with characters other than 0/1, or an empty string', () => {
    expect(() => binaryToDecimal('102')).toThrow()
    expect(() => binaryToDecimal('')).toThrow()
  })
})

describe('bitsFor', () => {
  it('produces the correct bit pattern, most significant first', () => {
    expect(bitsFor(5, 4)).toEqual([false, true, false, true]) // 0101
  })

  it('pads with leading zero-bits (false) to the requested width', () => {
    expect(bitsFor(1, 8)).toEqual([false, false, false, false, false, false, false, true])
  })

  it('rejects a value that does not fit in the requested width', () => {
    expect(() => bitsFor(256, 8)).toThrow()
  })
})
