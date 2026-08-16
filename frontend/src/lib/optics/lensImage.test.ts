import { describe, it, expect } from 'vitest'
import { lensImage, lensFocalLength } from './lensImage'

describe('lensFocalLength', () => {
  it('is positive for a convex lens', () => {
    expect(lensFocalLength(2, 'convex')).toBe(2)
  })

  it('is negative for a concave lens', () => {
    expect(lensFocalLength(2, 'concave')).toBe(-2)
  })

  it('rejects a non-positive magnitude', () => {
    expect(() => lensFocalLength(0, 'convex')).toThrow()
  })
})

describe('lensImage — convex lens, all five cases from §৯.৪.২ (pp. 259-264)', () => {
  const f = 2 // arbitrary focal length in metres

  it('object inside f (u = 0.5f): virtual, erect, magnified, p. 259', () => {
    const img = lensImage(0.5 * f, f)
    expect(img.real).toBe(false)
    expect(img.erect).toBe(true)
    expect(img.sizeRelation).toBe('magnified')
  })

  it('object at exactly f: no image forms, p. 264', () => {
    expect(() => lensImage(f, f)).toThrow()
  })

  it('object between f and 2f (u = 1.5f): real, inverted, magnified, beyond 2f, p. 262', () => {
    const img = lensImage(1.5 * f, f)
    expect(img.real).toBe(true)
    expect(img.erect).toBe(false)
    expect(img.sizeRelation).toBe('magnified')
    expect(img.imageDistance).toBeGreaterThan(2 * f)
  })

  it('object at exactly 2f: real, inverted, same size, image also at 2f, p. 263', () => {
    const img = lensImage(2 * f, f)
    expect(img.real).toBe(true)
    expect(img.sizeRelation).toBe('same')
    expect(img.imageDistance).toBeCloseTo(2 * f, 6)
  })

  it('object beyond 2f (u = 3f): real, inverted, diminished, between f and 2f, p. 264', () => {
    const img = lensImage(3 * f, f)
    expect(img.real).toBe(true)
    expect(img.erect).toBe(false)
    expect(img.sizeRelation).toBe('diminished')
    expect(img.imageDistance).toBeGreaterThan(f)
    expect(img.imageDistance).toBeLessThan(2 * f)
  })

  it('object at infinity: image forms at F', () => {
    const img = lensImage(1e9, f)
    expect(img.imageDistance).toBeCloseTo(f, 3)
    expect(img.real).toBe(true)
  })
})

describe('lensImage — concave lens: always virtual, erect, diminished, pp. 257-259', () => {
  const f = lensFocalLength(2, 'concave')

  it('is virtual and erect at a range of object distances', () => {
    for (const u of [0.1, 1, 5, 50]) {
      const img = lensImage(u, f)
      expect(img.real).toBe(false)
      expect(img.erect).toBe(true)
    }
  })

  it('is always diminished', () => {
    for (const u of [0.1, 1, 5, 50]) {
      expect(lensImage(u, f).sizeRelation).toBe('diminished')
    }
  })
})

describe('lensImage — input validation', () => {
  it('rejects non-positive object distance', () => {
    expect(() => lensImage(0, 2)).toThrow()
  })

  it('rejects a zero focal length', () => {
    expect(() => lensImage(1, 0)).toThrow()
  })
})
