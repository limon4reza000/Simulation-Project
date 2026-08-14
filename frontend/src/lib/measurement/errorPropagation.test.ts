import { describe, it, expect } from 'vitest'
import {
  propagateProduct,
  readingUncertainty,
  formatWithUncertainty,
  type Measurement,
} from './errorPropagation'

/**
 * §১.৭ of the book works two examples fully. Both are reproduced here exactly,
 * so a failure means the simulation would show a student something different
 * from the page in front of them.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), pp. 26–28.
 */

describe('reading uncertainty — p. 26', () => {
  it('a cm-only ruler gives ± 0.5 cm', () => {
    expect(readingUncertainty(1)).toBe(0.5)
  })

  it('formats as the book writes it: (4.0 ± 0.5) cm', () => {
    expect(formatWithUncertainty({ value: 4, uncertainty: 0.5 }, 'cm')).toBe(
      '(4.0 ± 0.5) cm',
    )
  })
})

describe('worked example: box volume — p. 28', () => {
  // "তুমি একটি বাক্স এমন একটি রুলার দিয়ে মেপেছ, যেখানে শুধু cm দিয়ে দাগ...
  //  দৈর্ঘ্য প্রস্থ এবং উচ্চতা হিসেবে পেয়েছ 10 cm, 5 cm, 4 cm"
  const box: Measurement[] = [
    { value: 10, uncertainty: 0.5, label: 'দৈর্ঘ্য' },
    { value: 5, uncertainty: 0.5, label: 'প্রস্থ' },
    { value: 4, uncertainty: 0.5, label: 'উচ্চতা' },
  ]

  const result = propagateProduct(box)

  it('nominal volume is 200 cm³', () => {
    expect(result.nominal).toBe(200)
  })

  it('smallest possible volume is 149.625 cm³', () => {
    // (10-0.5) x (5-0.5) x (4-0.5)
    expect(result.minimum).toBe(149.625)
  })

  it('largest possible volume is 259.875 cm³', () => {
    // (10+0.5) x (5+0.5) x (4+0.5)
    expect(result.maximum).toBe(259.875)
  })

  it('absolute error is the larger deviation, 59.875 cm³', () => {
    // 200 - 149.625 = 50.375 ; 259.875 - 200 = 59.875 ; "আমরা বড়টি নিই"
    expect(result.absoluteError).toBe(59.875)
  })

  it('relative error is 29.9375 %, which the book rounds to ≅ 30 %', () => {
    expect(result.relativeErrorPercent).toBe(29.9375)
    expect(Math.round(result.relativeErrorPercent)).toBe(30)
  })
})

describe('worked example: area — p. 28', () => {
  // A 10 % error in length: 10 ± 1 cm.
  const square: Measurement[] = [
    { value: 10, uncertainty: 1 },
    { value: 10, uncertainty: 1 },
  ]

  it('absolute error is 21 cm² and relative error 21 %', () => {
    // "কাজেই আপেক্ষিক ত্রুটি 21 cm² /100 cm² = 0.21, শতাংশের হিসাবে 21%"
    const r = propagateProduct(square)
    expect(r.nominal).toBe(100)
    expect(r.maximum).toBe(121)
    expect(r.absoluteError).toBe(21)
    expect(r.relativeErrorPercent).toBe(21)
  })
})

describe('the chapter’s central claim — p. 28', () => {
  // "দৈর্ঘ্যের পরিমাপে 10% ত্রুটি হলে ক্ষেত্রফলের বেলায় সেটি হবে প্রায় দ্বিগুণ।
  //  একইভাবে তুমি দেখাতে পারবে আয়তন মাপা হলে তার ত্রুটি হবে তিন গুণ!"
  const tenPercent = { value: 10, uncertainty: 1 }

  it('a 10 % length error roughly doubles in area', () => {
    const r = propagateProduct([tenPercent, tenPercent])
    expect(r.relativeErrorPercent).toBeGreaterThan(19)
    expect(r.relativeErrorPercent).toBeLessThan(23)
  })

  it('and roughly triples in volume', () => {
    const r = propagateProduct([tenPercent, tenPercent, tenPercent])
    expect(r.relativeErrorPercent).toBeGreaterThan(29)
    expect(r.relativeErrorPercent).toBeLessThan(35)
  })
})

describe('guards', () => {
  it('rejects an empty measurement list', () => {
    expect(() => propagateProduct([])).toThrow()
  })

  it('rejects negative uncertainty', () => {
    expect(() => propagateProduct([{ value: 5, uncertainty: -1 }])).toThrow()
  })

  it('rejects uncertainty larger than the value', () => {
    expect(() => propagateProduct([{ value: 1, uncertainty: 2 }])).toThrow()
  })
})
