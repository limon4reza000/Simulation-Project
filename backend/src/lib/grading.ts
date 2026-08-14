import { QuestionType } from '@prisma/client'

/**
 * Quiz grading.
 *
 * Lives on the server and only on the server. The API never sends answerConfig
 * to a student, so grading cannot be done in the browser — a client-side
 * grader would mean the answer key is one devtools panel away.
 *
 * Pure and free of Prisma so it can be tested directly.
 */

/** Shape of Question.answerConfig. Option keys for choice questions. */
export interface AnswerConfig {
  correct: string[]
  /** SHORT_ANSWER only: additional accepted spellings. */
  accept?: string[]
}

export type Response = string | string[] | null | undefined

export interface QuestionForGrading {
  id: number
  type: QuestionType
  answerConfig: AnswerConfig
  marks: number
}

export interface GradedQuestion {
  questionId: number
  correct: boolean
  marksAwarded: number
}

export interface GradedAttempt {
  score: number
  maxScore: number
  results: GradedQuestion[]
}

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'

/**
 * Maps Bangla digits onto ASCII so a student typing ৩.৩৩ is not marked wrong
 * against a key stored as 3.33. On a Bangla-first platform this is correctness,
 * not politeness — the numerals in the textbook are Bangla.
 */
export function normaliseAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)))
    // Bangla and ASCII decimal separators, and stray spacing.
    .replace(/\s+/g, ' ')
}

function asArray(response: Response): string[] {
  if (response === null || response === undefined) return []
  return Array.isArray(response) ? response : [response]
}

export function gradeResponse(
  type: QuestionType,
  answerConfig: AnswerConfig,
  response: Response,
): boolean {
  const given = asArray(response).filter((v) => v !== '')
  const correct = answerConfig.correct ?? []

  if (given.length === 0) return false

  switch (type) {
    case QuestionType.MCQ_SINGLE:
    case QuestionType.TRUE_FALSE:
      // More than one selection on a single-answer question is an error, not a
      // lucky guess that happens to contain the right key.
      return given.length === 1 && correct.includes(given[0])

    case QuestionType.MCQ_MULTI: {
      const givenSet = new Set(given)
      const correctSet = new Set(correct)
      if (givenSet.size !== correctSet.size) return false
      for (const key of correctSet) if (!givenSet.has(key)) return false
      return true
    }

    case QuestionType.SHORT_ANSWER: {
      const accepted = [...correct, ...(answerConfig.accept ?? [])].map(
        normaliseAnswer,
      )
      return accepted.includes(normaliseAnswer(given[0]))
    }

    default:
      return false
  }
}

export function gradeAttempt(
  questions: QuestionForGrading[],
  responses: Record<string, Response>,
): GradedAttempt {
  const results = questions.map((question) => {
    const correct = gradeResponse(
      question.type,
      question.answerConfig,
      responses[String(question.id)],
    )
    return {
      questionId: question.id,
      correct,
      marksAwarded: correct ? question.marks : 0,
    }
  })

  return {
    score: results.reduce((sum, r) => sum + r.marksAwarded, 0),
    maxScore: questions.reduce((sum, q) => sum + q.marks, 0),
    results,
  }
}
