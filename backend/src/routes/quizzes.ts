import { Router } from 'express'
import { z } from 'zod'
import { AttemptStatus, type PrismaClient, type Prisma } from '@prisma/client'
import { asyncHandler, HttpError } from '../lib/errors'
import { parseId, parseLanguage } from '../lib/http'
import { requireStudent } from '../lib/auth'
import { gradeAttempt, type AnswerConfig, type Response } from '../lib/grading'
import { mapQuizForStudent, quizInclude } from '../mappers/quiz'

/**
 * Quiz delivery and grading.
 *
 * The load-bearing rule: GET /api/quizzes/:id must never include answerConfig.
 * Grading happens here, against rows read fresh from the database, because
 * anything sent to the browser is visible to the student. There is a test that
 * asserts no answer key appears anywhere in the fetch response body.
 */

function asAnswerConfig(value: Prisma.JsonValue): AnswerConfig {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    return {
      correct: Array.isArray(record.correct) ? (record.correct as string[]) : [],
      accept: Array.isArray(record.accept) ? (record.accept as string[]) : undefined,
    }
  }
  return { correct: [] }
}

const submitSchema = z.object({
  responses: z.record(
    z.string(),
    z.union([z.string().max(500), z.array(z.string().max(500)).max(20), z.null()]),
  ),
})

export function createQuizRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.get(
    '/quizzes/:quizId',
    asyncHandler(async (req, res) => {
      const quizId = parseId(req.params.quizId, 'quiz')
      const language = parseLanguage(req.query.lang)

      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, status: 'PUBLISHED' },
        include: quizInclude,
      })
      if (!quiz) throw HttpError.notFound('Quiz')

      res.json({ data: mapQuizForStudent(quiz, language) })
    }),
  )

  router.post(
    '/quizzes/:quizId/attempts',
    asyncHandler(async (req, res) => {
      const quizId = parseId(req.params.quizId, 'quiz')
      const studentUserId = requireStudent(req)

      const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, status: 'PUBLISHED' },
        select: { id: true, attemptLimit: true },
      })
      if (!quiz) throw HttpError.notFound('Quiz')

      const student = await prisma.student.findUnique({
        where: { userId: studentUserId },
        select: { userId: true },
      })
      if (!student) throw HttpError.notFound('Student')

      if (quiz.attemptLimit !== null) {
        const used = await prisma.quizAttempt.count({
          where: { quizId, studentUserId, status: AttemptStatus.SUBMITTED },
        })
        if (used >= quiz.attemptLimit) {
          throw new HttpError(
            409,
            'No attempts remaining for this quiz',
            'ATTEMPT_LIMIT_REACHED',
          )
        }
      }

      const attempt = await prisma.quizAttempt.create({
        data: { quizId, studentUserId, status: AttemptStatus.IN_PROGRESS },
        select: { id: true, startedAt: true },
      })

      res.status(201).json({ data: attempt })
    }),
  )

  router.post(
    '/attempts/:attemptId/submit',
    asyncHandler(async (req, res) => {
      const attemptId = parseId(req.params.attemptId, 'attempt')
      const studentUserId = requireStudent(req)
      const language = parseLanguage(req.query.lang)

      const parsed = submitSchema.safeParse(req.body)
      if (!parsed.success) {
        throw HttpError.badRequest('Invalid submission', parsed.error.issues)
      }
      const responses = parsed.data.responses as Record<string, Response>

      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz: {
            include: {
              questions: {
                orderBy: { displayOrder: 'asc' },
                include: { question: true },
              },
            },
          },
        },
      })
      if (!attempt) throw HttpError.notFound('Attempt')

      // An attempt belongs to exactly one student. Without this check any
      // authenticated student could submit answers into someone else's attempt.
      if (attempt.studentUserId !== studentUserId) {
        throw new HttpError(403, 'Not your attempt', 'FORBIDDEN')
      }
      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        throw new HttpError(409, 'Attempt already submitted', 'ALREADY_SUBMITTED')
      }

      const questions = attempt.quiz.questions.map((link) => ({
        id: link.question.id,
        type: link.question.type,
        answerConfig: asAnswerConfig(link.question.answerConfig),
        marks: link.marks,
      }))

      const graded = gradeAttempt(questions, responses)

      await prisma.$transaction([
        prisma.quizAttemptAnswer.createMany({
          data: graded.results.map((result) => ({
            attemptId,
            questionId: result.questionId,
            response: (responses[String(result.questionId)] ??
              null) as Prisma.InputJsonValue,
            isCorrect: result.correct,
            marksAwarded: result.marksAwarded,
          })),
          skipDuplicates: true,
        }),
        prisma.quizAttempt.update({
          where: { id: attemptId },
          data: {
            status: AttemptStatus.SUBMITTED,
            submittedAt: new Date(),
            score: graded.score,
            maxScore: graded.maxScore,
          },
        }),
      ])

      // Now that the attempt is closed, revealing the key is safe and is what
      // makes the result screen a teaching moment rather than just a number.
      res.json({
        data: {
          attemptId,
          score: graded.score,
          maxScore: graded.maxScore,
          passMark: attempt.quiz.passMark,
          results: graded.results.map((result) => {
            const link = attempt.quiz.questions.find(
              (q) => q.question.id === result.questionId,
            )!
            return {
              questionId: result.questionId,
              correct: result.correct,
              marksAwarded: result.marksAwarded,
              correctKeys: asAnswerConfig(link.question.answerConfig).correct,
              explanation:
                language === 'BN'
                  ? link.question.explanationBn
                  : link.question.explanationEn,
            }
          }),
        },
      })
    }),
  )

  return router
}
