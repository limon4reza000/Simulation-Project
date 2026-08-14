import { describe, it, expect } from 'vitest'
import {
  completionPercent,
  averageScorePercent,
  topicStatus,
  identifyWeakTopics,
  overallCompletion,
} from '../lib/progress'

describe('completionPercent', () => {
  it('computes the obvious cases', () => {
    expect(completionPercent(0, 4)).toBe(0)
    expect(completionPercent(1, 4)).toBe(25)
    expect(completionPercent(4, 4)).toBe(100)
  })

  it('rounds to two places rather than emitting 33.33333333333333', () => {
    expect(completionPercent(1, 3)).toBe(33.33)
    expect(completionPercent(2, 3)).toBe(66.67)
  })

  it('never exceeds 100, even if the counts disagree', () => {
    // A stale count must not produce a value the database CHECK rejects.
    expect(completionPercent(7, 4)).toBe(100)
  })

  it('treats an empty topic as 0, not as division by zero', () => {
    expect(completionPercent(0, 0)).toBe(0)
    expect(completionPercent(3, 0)).toBe(0)
  })

  it('never returns a negative value', () => {
    expect(completionPercent(-2, 4)).toBe(0)
  })
})

describe('averageScorePercent', () => {
  it('averages across attempts as percentages', () => {
    expect(
      averageScorePercent([
        { score: 4, maxScore: 5 },
        { score: 5, maxScore: 5 },
      ]),
    ).toBe(90)
  })

  it('normalises quizzes of different lengths before averaging', () => {
    // 5/10 and 1/2 are both 50%; a naive sum of raw scores would not agree.
    expect(
      averageScorePercent([
        { score: 5, maxScore: 10 },
        { score: 1, maxScore: 2 },
      ]),
    ).toBe(50)
  })

  it('returns null when nothing has been attempted', () => {
    // Distinct from scoring zero: a student who has taken no quiz should not
    // be shown 0%.
    expect(averageScorePercent([])).toBeNull()
  })

  it('returns 0 when the student genuinely scored zero', () => {
    expect(averageScorePercent([{ score: 0, maxScore: 5 }])).toBe(0)
  })

  it('ignores attempts with no marks available', () => {
    expect(
      averageScorePercent([
        { score: 0, maxScore: 0 },
        { score: 3, maxScore: 3 },
      ]),
    ).toBe(100)
  })
})

describe('topicStatus', () => {
  it('maps percentage onto the schema enum', () => {
    expect(topicStatus(0)).toBe('NOT_STARTED')
    expect(topicStatus(0.01)).toBe('IN_PROGRESS')
    expect(topicStatus(99.99)).toBe('IN_PROGRESS')
    expect(topicStatus(100)).toBe('COMPLETED')
  })
})

describe('identifyWeakTopics (FR-018)', () => {
  const snapshots = [
    { topicId: 1, completionPercent: 100, scoreAvg: 40, attempts: 2 },
    { topicId: 2, completionPercent: 100, scoreAvg: 85, attempts: 1 },
    { topicId: 3, completionPercent: 50, scoreAvg: 55, attempts: 3 },
    { topicId: 4, completionPercent: 0, scoreAvg: null, attempts: 0 },
  ]

  it('flags only topics scored below the threshold', () => {
    const weak = identifyWeakTopics(snapshots)
    expect(weak.map((w) => w.topicId)).toEqual([1, 3])
  })

  it('orders weakest first, so the dashboard leads with what matters', () => {
    expect(identifyWeakTopics(snapshots)[0].topicId).toBe(1)
  })

  it('does NOT flag topics the student has never attempted', () => {
    // Otherwise a beginner opens the app to a screen of red for work they
    // have simply not reached yet.
    const weak = identifyWeakTopics(snapshots)
    expect(weak.some((w) => w.topicId === 4)).toBe(false)
  })

  it('honours a custom threshold', () => {
    expect(identifyWeakTopics(snapshots, 90).map((w) => w.topicId)).toEqual([1, 3, 2])
    expect(identifyWeakTopics(snapshots, 30)).toHaveLength(0)
  })
})

describe('overallCompletion', () => {
  it('weights by lesson count, not by topic count', () => {
    // One finished 1-lesson topic and one untouched 9-lesson topic is 10%
    // overall, not 50%.
    expect(
      overallCompletion([
        { completionPercent: 100, lessonCount: 1 },
        { completionPercent: 0, lessonCount: 9 },
      ]),
    ).toBe(10)
  })

  it('handles a fully finished chapter', () => {
    expect(
      overallCompletion([
        { completionPercent: 100, lessonCount: 3 },
        { completionPercent: 100, lessonCount: 2 },
      ]),
    ).toBe(100)
  })

  it('returns 0 for a chapter with no lessons', () => {
    expect(overallCompletion([])).toBe(0)
    expect(overallCompletion([{ completionPercent: 0, lessonCount: 0 }])).toBe(0)
  })
})
