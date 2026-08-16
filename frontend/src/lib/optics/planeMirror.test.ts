import { describe, it, expect } from 'vitest'
import { imageDistance, minimumMirrorLength } from './planeMirror'

describe('imageDistance — image is as far behind as the object is in front, p. 220', () => {
  it('equals the object distance exactly', () => {
    expect(imageDistance(2)).toBe(2)
    expect(imageDistance(0.5)).toBe(0.5)
  })

  it('rejects a non-positive object distance', () => {
    expect(() => imageDistance(0)).toThrow()
  })
})

describe('minimumMirrorLength — চিত্র ৮.১২, p. 221', () => {
  it('reproduces the book\'s own worked example exactly: 1.5 m person → 0.75 m mirror', () => {
    expect(minimumMirrorLength(1.5)).toBe(0.75)
  })

  it('is always exactly half the viewer\'s height', () => {
    expect(minimumMirrorLength(2)).toBe(1)
    expect(minimumMirrorLength(1)).toBe(0.5)
  })

  it('does not depend on distance from the mirror — the function takes no such parameter', () => {
    // The book's own point (p. 221): the required length is the same whether
    // you stand 1 m or 10 m away. Documented here by the function's own
    // signature having no distance-from-mirror parameter at all.
    expect(minimumMirrorLength.length).toBe(1)
  })

  it('rejects a non-positive viewer height', () => {
    expect(() => minimumMirrorLength(0)).toThrow()
  })
})
