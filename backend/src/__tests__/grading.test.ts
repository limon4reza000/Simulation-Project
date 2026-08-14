import { describe, it, expect } from 'vitest'
import { QuestionType } from '@prisma/client'
import {
  gradeResponse,
  gradeAttempt,
  normaliseAnswer,
  type QuestionForGrading,
} from '../lib/grading'

const single = QuestionType.MCQ_SINGLE
const multi = QuestionType.MCQ_MULTI
const short = QuestionType.SHORT_ANSWER

describe('normaliseAnswer', () => {
  it('maps Bangla digits onto ASCII', () => {
    // The textbook prints numerals in Bangla, so a student may well type them.
    expect(normaliseAnswer('৩.৩৩')).toBe('3.33')
    expect(normaliseAnswer('৪.০৭')).toBe('4.07')
    expect(normaliseAnswer('১০')).toBe('10')
  })

  it('ignores case and surrounding whitespace', () => {
    expect(normaliseAnswer('  Metre ')).toBe('metre')
    expect(normaliseAnswer('a   b')).toBe('a b')
  })
})

describe('MCQ_SINGLE', () => {
  const answer = { correct: ['ka'] }

  it('accepts the correct key', () => {
    expect(gradeResponse(single, answer, 'ka')).toBe(true)
  })

  it('rejects a wrong key', () => {
    expect(gradeResponse(single, answer, 'kha')).toBe(false)
  })

  it('rejects an empty or missing response', () => {
    expect(gradeResponse(single, answer, '')).toBe(false)
    expect(gradeResponse(single, answer, null)).toBe(false)
    expect(gradeResponse(single, answer, undefined)).toBe(false)
  })

  it('rejects selecting everything to guarantee a hit', () => {
    // Without this, submitting all four options would score full marks.
    expect(gradeResponse(single, answer, ['ka', 'kha', 'ga', 'gha'])).toBe(false)
  })
})

describe('MCQ_MULTI', () => {
  const answer = { correct: ['ka', 'ga'] }

  it('requires the exact set', () => {
    expect(gradeResponse(multi, answer, ['ka', 'ga'])).toBe(true)
    expect(gradeResponse(multi, answer, ['ga', 'ka'])).toBe(true)
  })

  it('rejects a partial selection', () => {
    expect(gradeResponse(multi, answer, ['ka'])).toBe(false)
  })

  it('rejects a superset', () => {
    expect(gradeResponse(multi, answer, ['ka', 'ga', 'kha'])).toBe(false)
  })
})

describe('SHORT_ANSWER', () => {
  const answer = { correct: ['3.33'], accept: ['3.33%'] }

  it('accepts an exact match', () => {
    expect(gradeResponse(short, answer, '3.33')).toBe(true)
  })

  it('accepts a listed alternative spelling', () => {
    expect(gradeResponse(short, answer, '3.33%')).toBe(true)
  })

  it('accepts the same value written in Bangla numerals', () => {
    expect(gradeResponse(short, answer, '৩.৩৩')).toBe(true)
  })

  it('rejects a different value', () => {
    expect(gradeResponse(short, answer, '3.44')).toBe(false)
  })
})

describe('gradeAttempt', () => {
  const questions: QuestionForGrading[] = [
    { id: 1, type: single, answerConfig: { correct: ['ka'] }, marks: 1 },
    { id: 2, type: single, answerConfig: { correct: ['ga'] }, marks: 1 },
    { id: 3, type: single, answerConfig: { correct: ['kha'] }, marks: 2 },
  ]

  it('totals marks, not question count', () => {
    const result = gradeAttempt(questions, { '1': 'ka', '2': 'ga', '3': 'kha' })
    expect(result.score).toBe(4)
    expect(result.maxScore).toBe(4)
    expect(result.results.every((r) => r.correct)).toBe(true)
  })

  it('awards partial totals and reports per question', () => {
    const result = gradeAttempt(questions, { '1': 'ka', '2': 'kha', '3': 'kha' })
    expect(result.score).toBe(3)
    expect(result.maxScore).toBe(4)
    expect(result.results.map((r) => r.correct)).toEqual([true, false, true])
  })

  it('treats unanswered questions as wrong rather than skipping them', () => {
    const result = gradeAttempt(questions, {})
    expect(result.score).toBe(0)
    expect(result.maxScore).toBe(4)
    expect(result.results).toHaveLength(3)
  })
})

describe('the seeded Chapter 1 questions', () => {
  // Answer keys derived from the book, not printed in it. See seed.ts.
  it('grades Q5 relative error: 0.5 / 15 = 3.33 %', () => {
    expect(gradeResponse(single, { correct: ['gha'] }, 'gha')).toBe(true)
  })

  it('grades Q6 volume ratio 168 : 113.1 = 1 : 0.673', () => {
    const block = 7 * 6 * 4
    const sphere = (4 / 3) * Math.PI * 3 ** 3
    expect(Number((sphere / block).toFixed(3))).toBe(0.673)
  })
})
