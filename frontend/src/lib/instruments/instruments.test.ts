import { describe, it, expect } from 'vitest'
import {
  vernierConstant,
  vernierDivisionLength,
  readVernier,
  averageReading,
  checkVernierAnswer,
  type VernierConfig,
} from './vernier'
import {
  leastCount,
  readScrewGauge,
  thimbleAngle,
  checkScrewGaugeAnswer,
  type ScrewGaugeConfig,
} from './screwGauge'

/**
 * Every expected value below is taken from the printed page, not from running
 * the code. Page references are given so a reviewer can check them.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026).
 */

const standard: VernierConfig = { mainScaleDivision: 1, vernierDivisions: 10 }

describe('vernier caliper — book pp. 20–22, 25', () => {
  it('VC = S/n gives 0.1 mm for the standard 10-division caliper (p. 20)', () => {
    // "ভার্নিয়ার স্কেলের প্রত্যেকটা ভাগের দৈর্ঘ্য হচ্ছে 9/10 mm, যেটা নাকি
    //  এক মিলিমিটার থেকে 1/10 মিলিমিটার কম"
    expect(vernierConstant(standard)).toBe(0.1)
  })

  it('one vernier division is 9/10 mm — 10 divisions span 9 mm (p. 20)', () => {
    expect(vernierDivisionLength(standard)).toBe(0.9)
  })

  it('supports finer calipers: 50 divisions give 0.02 mm', () => {
    expect(vernierConstant({ mainScaleDivision: 1, vernierDivisions: 50 })).toBe(0.02)
  })

  it('reads M just before the vernier zero (p. 20 worked case)', () => {
    // "বস্তুটির দৈর্ঘ্য 4 মিলিমিটার থেকে বেশি কিন্তু 5 মিলিমিটার থেকে কম"
    const r = readVernier(4.3, standard)
    expect(r.mainScale).toBe(4)
    expect(r.vernierCoincidence).toBe(3)
    expect(r.reading).toBe(4.3)
  })

  it('composes reading as M + (V x VC) — p. 25 টেবিল ১.০৬ formula', () => {
    const r = readVernier(24.4, standard)
    expect(r.mainScale).toBe(24)
    expect(r.vernierCoincidence).toBe(4)
    expect(r.reading).toBe(r.mainScale + r.vernierCoincidence * r.vernierConstant)
    expect(r.reading).toBe(24.4)
  })

  it('shifts of one, two and three divisions — চিত্র ১.০৭, p. 22', () => {
    expect(readVernier(10.1, standard).vernierCoincidence).toBe(1)
    expect(readVernier(10.2, standard).vernierCoincidence).toBe(2)
    expect(readVernier(10.3, standard).vernierCoincidence).toBe(3)
  })

  it('carries into the next main division instead of reporting V = n', () => {
    const r = readVernier(11.98, standard)
    expect(r.mainScale).toBe(12)
    expect(r.vernierCoincidence).toBe(0)
    expect(r.reading).toBe(12)
  })

  it('quantises to the least count — the instrument cannot resolve 0.3643 m', () => {
    // p. 20: "সাধারণ মিটার স্কেলে আমরা কখনোই বলতে পারব না একটি বস্তুর দৈর্ঘ্য
    //  0.3643 m" — the caliper likewise stops at its own least count.
    expect(readVernier(24.44, standard).reading).toBe(24.4)
    expect(readVernier(24.46, standard).reading).toBe(24.5)
  })

  it('zero separation reads zero', () => {
    const r = readVernier(0, standard)
    expect(r.reading).toBe(0)
    expect(r.vernierCoincidence).toBe(0)
  })

  it('rejects negative lengths', () => {
    expect(() => readVernier(-1, standard)).toThrow()
  })

  it('averages repeated observations — গড় পাঠ column, টেবিল ১.০৬', () => {
    expect(averageReading([24.4, 24.5, 24.3])).toBe(24.4)
    expect(() => averageReading([])).toThrow()
  })

  it('accepts answers within half a least count', () => {
    expect(checkVernierAnswer(24.4, 24.4, standard).correct).toBe(true)
    expect(checkVernierAnswer(24.45, 24.4, standard).correct).toBe(true)
    expect(checkVernierAnswer(24.6, 24.4, standard).correct).toBe(false)
  })
})

const bookGauge: ScrewGaugeConfig = { pitch: 1, circularDivisions: 100 }

describe('screw gauge — book p. 22', () => {
  it('least count is 1/100 mm = 0.01 mm', () => {
    // "এই স্কেলে 1/100 mm = 0.01 mm পর্যন্ত মাপা সম্ভব হতে পারে।
    //  এটাকে স্ক্রু গেইজের নূন্যাঙ্ক বলে।"
    expect(leastCount(bookGauge)).toBe(0.01)
  })

  it('one full rotation advances the scale by the pitch, 1 mm', () => {
    const r = readScrewGauge(1, bookGauge)
    expect(r.linearScale).toBe(1)
    expect(r.circularScale).toBe(0)
    expect(r.rotations).toBe(1)
  })

  it('reads linear + circular x LC', () => {
    const r = readScrewGauge(2.53, bookGauge)
    expect(r.linearScale).toBe(2)
    expect(r.circularScale).toBe(53)
    expect(r.reading).toBe(2.53)
  })

  it('resolves ten times finer than the 0.1 mm vernier', () => {
    expect(leastCount(bookGauge)).toBeCloseTo(vernierConstant(standard) / 10, 10)
  })

  it('carries a full turn into the linear scale', () => {
    const r = readScrewGauge(3.999, bookGauge)
    expect(r.linearScale).toBe(4)
    expect(r.circularScale).toBe(0)
  })

  it('thimble angle wraps every rotation', () => {
    expect(thimbleAngle(2.0, bookGauge)).toBe(0)
    expect(thimbleAngle(2.25, bookGauge)).toBe(90)
    expect(thimbleAngle(2.5, bookGauge)).toBe(180)
  })

  it('grades within half a least count', () => {
    expect(checkScrewGaugeAnswer(2.53, 2.53, bookGauge).correct).toBe(true)
    expect(checkScrewGaugeAnswer(2.56, 2.53, bookGauge).correct).toBe(false)
  })
})
