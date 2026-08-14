import { useCallback, useMemo, useState } from 'react'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * QUIZ_RUNNER — নমুনা প্রশ্ন
 *
 * Renders a quiz and reports the submission upward. It never grades: the answer
 * key lives on the server and the API does not send it with the questions, so a
 * client-side grader would be both impossible and a mistake.
 *
 * `onSubmit` is supplied by the lesson layer — API-backed in normal operation,
 * fixture-backed in the offline dev harness. The component itself is unaware of
 * which, which is what keeps it testable and honest.
 */

export interface QuizOption {
  key: string
  text: string
}

export interface QuizQuestionSpec {
  id: number
  type: string
  marks: number
  prompt: string
  options: QuizOption[]
}

export interface QuizResultRow {
  questionId: number
  correct: boolean
  marksAwarded: number
  correctKeys: string[]
  explanation?: string | null
}

export interface QuizResult {
  score: number
  maxScore: number
  passMark?: number | null
  results: QuizResultRow[]
}

interface Config {
  quizId?: number
  titleBn?: string
  titleEn?: string
  questions?: QuizQuestionSpec[]
  passMark?: number | null
}

interface Params {
  onSubmit?: (responses: Record<string, string>) => Promise<QuizResult>
}

const L = {
  submit: { bn: 'জমা দাও', en: 'Submit' },
  retry: { bn: 'আবার চেষ্টা করো', en: 'Try again' },
  score: { bn: 'তোমার স্কোর', en: 'Your score' },
  passed: { bn: 'উত্তীর্ণ হয়েছ!', en: 'Passed!' },
  failed: { bn: 'আরেকবার দেখে নাও', en: 'Review and try again' },
  correct: { bn: 'সঠিক', en: 'Correct' },
  wrong: { bn: 'ভুল', en: 'Incorrect' },
  unanswered: { bn: 'সব প্রশ্নের উত্তর দাও', en: 'Answer every question' },
  marks: { bn: 'নম্বর', en: 'marks' },
  submitting: { bn: 'জমা হচ্ছে…', en: 'Submitting…' },
  failedToSubmit: { bn: 'জমা দেওয়া যায়নি', en: 'Could not submit' },
} as const

type LabelKey = keyof typeof L

export default function QuizRunner({
  config,
  parameters,
  language = 'BN',
  onActivity,
}: RendererProps<Config, Params>) {
  const cfg = (config ?? {}) as Config
  const params = (parameters ?? {}) as Params

  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (value: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(value), 'BN') : String(value),
    [language],
  )

  const questions = useMemo(() => cfg.questions ?? [], [cfg.questions])

  const [responses, setResponses] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const answeredAll =
    questions.length > 0 &&
    questions.every((question) => responses[String(question.id)])

  const choose = useCallback(
    (questionId: number, optionKey: string) => {
      if (result) return // locked once submitted
      setResponses((current) => ({ ...current, [String(questionId)]: optionKey }))
    },
    [result],
  )

  const submit = useCallback(async () => {
    if (!params.onSubmit || !answeredAll) return
    setBusy(true)
    setError(null)
    try {
      const outcome = await params.onSubmit(responses)
      setResult(outcome)
      onActivity?.({
        activityType: 'QUIZ_SUBMITTED',
        metadata: { score: outcome.score, maxScore: outcome.maxScore },
        occurredAt: new Date().toISOString(),
      })
    } catch {
      setError(t('failedToSubmit'))
    } finally {
      setBusy(false)
    }
  }, [params, answeredAll, responses, onActivity, t])

  const retry = useCallback(() => {
    setResponses({})
    setResult(null)
    setError(null)
  }, [])

  const rowFor = useCallback(
    (questionId: number) =>
      result?.results.find((r) => r.questionId === questionId),
    [result],
  )

  if (questions.length === 0) {
    return (
      <figure className="sim">
        <figcaption className="sim__title">
          {language === 'BN' ? cfg.titleBn : cfg.titleEn}
        </figcaption>
        <p className="sim__note">
          {language === 'BN' ? 'কোনো প্রশ্ন পাওয়া যায়নি।' : 'No questions available.'}
        </p>
      </figure>
    )
  }

  const passed =
    result != null &&
    (result.passMark == null || result.score >= result.passMark)

  return (
    <figure className="sim quiz">
      <figcaption className="sim__title">
        {language === 'BN' ? cfg.titleBn : cfg.titleEn}
      </figcaption>

      <ol className="quiz__list">
        {questions.map((question, index) => {
          const row = rowFor(question.id)
          const chosen = responses[String(question.id)]
          return (
            <li key={question.id} className="quiz__question">
              <p className="quiz__prompt">
                <span className="quiz__number">{num(index + 1)}.</span>{' '}
                {question.prompt}
              </p>

              <div className="quiz__options">
                {question.options.map((option) => {
                  const isChosen = chosen === option.key
                  const isKey = row?.correctKeys.includes(option.key) ?? false
                  const state = !row
                    ? isChosen
                      ? 'is-chosen'
                      : ''
                    : isKey
                      ? 'is-key'
                      : isChosen
                        ? 'is-wrong'
                        : ''
                  return (
                    <label key={option.key} className={`quiz__option ${state}`}>
                      <input
                        type="radio"
                        name={`q${question.id}`}
                        value={option.key}
                        checked={isChosen ?? false}
                        disabled={Boolean(result)}
                        onChange={() => choose(question.id, option.key)}
                      />
                      <span>{option.text}</span>
                    </label>
                  )
                })}
              </div>

              {row && (
                <p className={`quiz__feedback is-${row.correct ? 'correct' : 'wrong'}`}>
                  <strong>{row.correct ? t('correct') : t('wrong')}</strong>
                  {row.explanation ? ` — ${row.explanation}` : null}
                </p>
              )}
            </li>
          )
        })}
      </ol>

      {!result && (
        <div className="quiz__actions">
          <button type="button" onClick={submit} disabled={!answeredAll || busy}>
            {busy ? t('submitting') : t('submit')}
          </button>
          {!answeredAll && <span className="sim__note">{t('unanswered')}</span>}
          {error && <span className="sim__verdict is-wrong">{error}</span>}
        </div>
      )}

      {result && (
        <div className="quiz__result">
          <div className={`sim__readout is-emphasis`}>
            <span>{t('score')}</span>
            <strong>
              {num(result.score)} / {num(result.maxScore)} {t('marks')}
            </strong>
          </div>
          <p className={`sim__verdict is-${passed ? 'correct' : 'wrong'}`}>
            {passed ? t('passed') : t('failed')}
          </p>
          <button type="button" className="is-secondary" onClick={retry}>
            {t('retry')}
          </button>
        </div>
      )}
    </figure>
  )
}
