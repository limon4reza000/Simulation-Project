import type { Prisma, Language } from '@prisma/client'

/**
 * Student-facing view of a quiz.
 *
 * Single source of truth for what a student is allowed to see, used by both
 * GET /api/quizzes/:id and the lesson mapper. Two independent implementations
 * would be two chances to leak the answer key; there is one, and it is tested.
 */

export const quizInclude = {
  questions: {
    orderBy: { displayOrder: 'asc' },
    include: { question: true },
  },
} satisfies Prisma.QuizInclude

export type QuizWithQuestions = Prisma.QuizGetPayload<{
  include: typeof quizInclude
}>

export interface StudentQuizOption {
  key: string
  text: string
}

export interface StudentQuizQuestion {
  id: number
  type: string
  marks: number
  displayOrder: number
  prompt: string
  options: StudentQuizOption[]
}

export interface StudentQuiz {
  id: number
  titleBn: string
  titleEn: string
  timeLimitSec: number | null
  attemptLimit: number | null
  passMark: number | null
  questions: StudentQuizQuestion[]
}

function asOptions(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return []
  return value as { key: string; textBn: string; textEn: string }[]
}

/**
 * Note what is absent and must stay absent: `answerConfig` and the
 * explanations. Both are returned only by the submit endpoint, once the
 * attempt is closed.
 */
export function mapQuizForStudent(
  quiz: QuizWithQuestions,
  language: Language,
): StudentQuiz {
  return {
    id: quiz.id,
    titleBn: quiz.titleBn,
    titleEn: quiz.titleEn,
    timeLimitSec: quiz.timeLimitSec,
    attemptLimit: quiz.attemptLimit,
    passMark: quiz.passMark,
    questions: quiz.questions.map((link) => ({
      id: link.question.id,
      type: link.question.type,
      marks: link.marks,
      displayOrder: link.displayOrder,
      prompt: language === 'BN' ? link.question.promptBn : link.question.promptEn,
      options: asOptions(link.question.optionsJson).map((option) => ({
        key: option.key,
        text: language === 'BN' ? option.textBn : option.textEn,
      })),
    })),
  }
}
