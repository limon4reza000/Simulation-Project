import { describe, it, expect } from 'vitest'
import {
  remainingFraction,
  remainingAmount,
  halfLifeFromDecay,
  halfLivesElapsed,
} from './halfLife'

describe('remainingFraction — N/N0 = (1/2)^(t/T), p. 352', () => {
  it('reproduces the book\'s own worked example exactly: 200 years at T=100 -> 1/4 remains', () => {
    expect(remainingFraction(200, 100)).toBeCloseTo(0.25, 6)
  })

  it('is exactly 1 at t=0', () => {
    expect(remainingFraction(0, 100)).toBe(1)
  })

  it('is exactly 0.5 at one half-life', () => {
    expect(remainingFraction(100, 100)).toBeCloseTo(0.5, 6)
  })

  it('rejects negative elapsed time or non-positive half-life', () => {
    expect(() => remainingFraction(-1, 100)).toThrow()
    expect(() => remainingFraction(1, 0)).toThrow()
  })
})

describe('remainingAmount', () => {
  it('reproduces the book\'s own worked example: 1 kg -> 250 g after 200 years at T=100', () => {
    expect(remainingAmount(1000, 200, 100)).toBeCloseTo(250, 3)
  })

  it('rejects non-positive initial amount', () => {
    expect(() => remainingAmount(0, 100, 100)).toThrow()
  })
})

describe('halfLifeFromDecay — সৃজনশীল প্রশ্ন ১, p. 360', () => {
  it('reproduces the book\'s own worked example exactly: 900 years, 25% remaining -> T=450', () => {
    expect(halfLifeFromDecay(900, 0.25)).toBeCloseTo(450, 3)
  })

  it('is the inverse of remainingFraction', () => {
    const frac = remainingFraction(300, 150)
    expect(halfLifeFromDecay(300, frac)).toBeCloseTo(150, 2)
  })

  it('rejects non-positive elapsed time or a fraction outside (0,1)', () => {
    expect(() => halfLifeFromDecay(0, 0.5)).toThrow()
    expect(() => halfLifeFromDecay(100, 0)).toThrow()
    expect(() => halfLifeFromDecay(100, 1)).toThrow()
  })
})

describe('halfLivesElapsed', () => {
  it('reproduces the book\'s own worked example: 200 years at T=100 -> 2 half-lives', () => {
    expect(halfLivesElapsed(200, 100)).toBe(2)
  })

  it('rejects negative elapsed time or non-positive half-life', () => {
    expect(() => halfLivesElapsed(-1, 100)).toThrow()
    expect(() => halfLivesElapsed(1, 0)).toThrow()
  })
})
