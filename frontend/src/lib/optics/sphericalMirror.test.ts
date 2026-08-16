import { describe, it, expect } from 'vitest'
import { focalLength, imageFromMirrorFormula } from './sphericalMirror'

describe('focalLength — f = r/2, pp. 225 & 229', () => {
  it('is positive for a concave mirror', () => {
    expect(focalLength(2, 'concave')).toBe(1)
  })

  it('is negative for a convex mirror — this module\'s own sign convention for a virtual focus', () => {
    expect(focalLength(2, 'convex')).toBe(-1)
  })

  it('rejects a non-positive radius', () => {
    expect(() => focalLength(0, 'concave')).toThrow()
  })
})

describe('imageFromMirrorFormula — concave mirror, টেবিল p. 232, every row', () => {
  const f = 2 // arbitrary focal length in metres, matches every row below

  it('object at infinity: image at F, real, point-sized', () => {
    const img = imageFromMirrorFormula(1e9, f)
    expect(img.imageDistance).toBeCloseTo(f, 3)
    expect(img.real).toBe(true)
    expect(img.magnification).toBeCloseTo(0, 3)
  })

  it('object beyond C (u = 3f): real, inverted, diminished, between F and C', () => {
    const img = imageFromMirrorFormula(3 * f, f)
    expect(img.real).toBe(true)
    expect(img.erect).toBe(false)
    expect(img.sizeRelation).toBe('diminished')
    expect(img.imageDistance).toBeGreaterThan(f)
    expect(img.imageDistance).toBeLessThan(2 * f)
  })

  it('object at C (u = 2f): real, inverted, same size, image also at C', () => {
    const img = imageFromMirrorFormula(2 * f, f)
    expect(img.real).toBe(true)
    expect(img.imageDistance).toBeCloseTo(2 * f, 6)
    expect(img.sizeRelation).toBe('same')
    expect(img.magnification).toBeCloseTo(1, 6)
  })

  it('object between C and F (u = 1.5f): real, inverted, magnified, beyond C', () => {
    const img = imageFromMirrorFormula(1.5 * f, f)
    expect(img.real).toBe(true)
    expect(img.sizeRelation).toBe('magnified')
    expect(img.imageDistance).toBeGreaterThan(2 * f)
  })

  it('object at F: no image forms', () => {
    expect(() => imageFromMirrorFormula(f, f)).toThrow()
  })

  it('object between F and P (u = 0.5f): virtual, erect, magnified', () => {
    const img = imageFromMirrorFormula(0.5 * f, f)
    expect(img.real).toBe(false)
    expect(img.erect).toBe(true)
    expect(img.sizeRelation).toBe('magnified')
  })

  it('object very close to the pole: virtual, erect, nearly same size', () => {
    const img = imageFromMirrorFormula(0.001 * f, f)
    expect(img.real).toBe(false)
    expect(img.magnification).toBeCloseTo(1, 2)
  })
})

describe('imageFromMirrorFormula — convex mirror: always virtual, erect, diminished, p. 226', () => {
  const f = focalLength(2, 'convex')

  it('is virtual and erect at a range of object distances', () => {
    for (const u of [0.1, 1, 5, 50]) {
      const img = imageFromMirrorFormula(u, f)
      expect(img.real).toBe(false)
      expect(img.erect).toBe(true)
    }
  })

  it('is always diminished', () => {
    for (const u of [0.1, 1, 5, 50]) {
      expect(imageFromMirrorFormula(u, f).sizeRelation).toBe('diminished')
    }
  })
})

describe('imageFromMirrorFormula — input validation', () => {
  it('rejects non-positive object distance', () => {
    expect(() => imageFromMirrorFormula(0, 2)).toThrow()
  })

  it('rejects a zero focal length', () => {
    expect(() => imageFromMirrorFormula(1, 0)).toThrow()
  })
})
