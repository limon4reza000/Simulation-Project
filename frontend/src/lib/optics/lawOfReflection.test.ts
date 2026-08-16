import { describe, it, expect } from 'vitest'
import { angleOfReflection, returnsAntiparallel } from './lawOfReflection'

describe('angleOfReflection — θr = θi, p. 215', () => {
  it('equals the angle of incidence exactly', () => {
    expect(angleOfReflection(35)).toBe(35)
    expect(angleOfReflection(0)).toBe(0)
    expect(angleOfReflection(90)).toBe(90)
  })

  it('rejects an angle outside 0-90 degrees', () => {
    expect(() => angleOfReflection(-1)).toThrow()
    expect(() => angleOfReflection(91)).toThrow()
  })
})

describe('returnsAntiparallel — p. 222, two mirrors at 60°', () => {
  it('reproduces the book\'s own worked example: 60° incidence on a 60° mirror pair', () => {
    expect(returnsAntiparallel(60, 60)).toBe(true)
  })

  it('is false when incidence and mirror angle differ', () => {
    expect(returnsAntiparallel(45, 60)).toBe(false)
  })

  it('holds for the general identity, not just 60°', () => {
    expect(returnsAntiparallel(30, 30)).toBe(true)
    expect(returnsAntiparallel(90, 90)).toBe(true)
  })

  it('rejects an out-of-range incidence or mirror angle', () => {
    expect(() => returnsAntiparallel(-1, 60)).toThrow()
    expect(() => returnsAntiparallel(60, 0)).toThrow()
  })
})
