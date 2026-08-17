import { describe, it, expect } from 'vitest'
import { isBlocked, recommendedShield } from './radiationShielding'

describe('isBlocked — চিত্র ১৩.০১, pp. 350-352', () => {
  it('alpha is blocked by any thickness of paper', () => {
    expect(isBlocked('alpha', 'paper', 0)).toBe(true)
    expect(isBlocked('alpha', 'paper', 1)).toBe(true)
  })

  it('beta is not blocked by paper', () => {
    expect(isBlocked('beta', 'paper', 5)).toBe(false)
  })

  it('beta is blocked by 3mm or more of aluminium, matching the book\'s own 3-5mm range', () => {
    expect(isBlocked('beta', 'aluminium', 2)).toBe(false)
    expect(isBlocked('beta', 'aluminium', 3)).toBe(true)
    expect(isBlocked('beta', 'aluminium', 5)).toBe(true)
  })

  it('gamma is not blocked by aluminium at any reasonable thickness', () => {
    expect(isBlocked('gamma', 'aluminium', 5)).toBe(false)
  })

  it('gamma is blocked only by a thick lead shield (30mm+, matching the book\'s 3-5cm)', () => {
    expect(isBlocked('gamma', 'lead', 10)).toBe(false)
    expect(isBlocked('gamma', 'lead', 30)).toBe(true)
  })

  it('rejects negative thickness', () => {
    expect(() => isBlocked('alpha', 'paper', -1)).toThrow()
  })
})

describe('recommendedShield', () => {
  it('reproduces the book\'s own three recommendations', () => {
    expect(recommendedShield('alpha')).toBe('paper')
    expect(recommendedShield('beta')).toBe('aluminium')
    expect(recommendedShield('gamma')).toBe('lead')
  })
})
