import { describe, it, expect } from 'vitest'
import { roundTripTime, minimumEchoDistance, isEchoAudible } from './echo'

describe('minimumEchoDistance — d = v(0.1)/2, p. 201-202', () => {
  it('reproduces the book\'s own worked example exactly: 330 m/s → 16.5 m', () => {
    expect(minimumEchoDistance(330)).toBe(16.5)
  })

  it('scales linearly with speed', () => {
    expect(minimumEchoDistance(660)).toBeCloseTo(2 * minimumEchoDistance(330), 6)
  })

  it('rejects non-positive speed or minimum gap', () => {
    expect(() => minimumEchoDistance(0)).toThrow()
    expect(() => minimumEchoDistance(330, 0)).toThrow()
  })
})

describe('roundTripTime', () => {
  it('is exactly 0.1 s at the book\'s own minimum echo distance', () => {
    expect(roundTripTime(16.5, 330)).toBeCloseTo(0.1, 6)
  })

  it('doubles when distance doubles', () => {
    expect(roundTripTime(20, 330)).toBeCloseTo(2 * roundTripTime(10, 330), 6)
  })

  it('rejects non-positive distance or speed', () => {
    expect(() => roundTripTime(0, 330)).toThrow()
    expect(() => roundTripTime(10, 0)).toThrow()
  })
})

describe('isEchoAudible', () => {
  it('is true at exactly the minimum distance', () => {
    expect(isEchoAudible(16.5, 330)).toBe(true)
  })

  it('is false just below the minimum distance', () => {
    expect(isEchoAudible(16, 330)).toBe(false)
  })

  it('is true well beyond the minimum distance', () => {
    expect(isEchoAudible(50, 330)).toBe(true)
  })

  it('reflects that a higher sound speed needs a greater distance for the same echo gap', () => {
    // The same 17.25 m reflector: audible at 330 m/s (minimum distance
    // 16.5 m, comfortably inside 17.25 m) but not at 350 m/s (minimum
    // distance 17.5 m, just past 17.25 m) — the sample-question's own point
    // that a warmer day can silence an echo that a cooler day would return.
    expect(isEchoAudible(17.25, 330)).toBe(true)
    expect(isEchoAudible(17.25, 350)).toBe(false)
  })
})
