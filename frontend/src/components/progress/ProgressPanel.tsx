import { useCallback } from 'react'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { ChapterProgress } from '../../lib/api'
import type { Language } from '../../registry/types'

/**
 * A student's own progress through the chapter.
 *
 * Weak topics are shown as "needs review" rather than as failure, and only
 * appear once the student has actually attempted something — a beginner should
 * not open the app to a wall of red for work they have not reached.
 */

const L = {
  heading: { bn: 'তোমার অগ্রগতি', en: 'Your progress' },
  overall: { bn: 'সম্পূর্ণ হয়েছে', en: 'Complete' },
  lessons: { bn: 'পাঠ', en: 'lessons' },
  score: { bn: 'গড় স্কোর', en: 'Average score' },
  review: { bn: 'আবার দেখা দরকার', en: 'Needs review' },
  notStarted: { bn: 'শুরু হয়নি', en: 'Not started' },
  markDone: { bn: 'এই পাঠ শেষ', en: 'Mark lesson complete' },
  done: { bn: 'শেষ হয়েছে', en: 'Completed' },
} as const

interface Props {
  progress: ChapterProgress
  language?: Language
  currentLessonId?: number | null
  currentLessonCompleted?: boolean
  onMarkComplete?: () => void
}

export default function ProgressPanel({
  progress,
  language = 'BN',
  currentLessonId,
  currentLessonCompleted = false,
  onMarkComplete,
}: Props) {
  const t = useCallback(
    (key: keyof typeof L) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (v: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(v), 'BN') : String(v),
    [language],
  )

  return (
    <section className="progress" aria-label={t('heading')}>
      <header className="progress__header">
        <h2 className="progress__title">{t('heading')}</h2>
        <span className="progress__overall">
          {num(Math.round(progress.overallPercent))}% {t('overall')}
        </span>
      </header>

      <div
        className="progress__bar"
        role="progressbar"
        aria-valuenow={Math.round(progress.overallPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress.overallPercent}%` }} />
      </div>

      <ul className="progress__topics">
        {progress.topics.map((topic) => {
          const weak = progress.weakTopicIds.includes(topic.topicId)
          return (
            <li key={topic.topicId} className="progress__topic">
              <div className="progress__topicHead">
                <span className="progress__topicName">
                  {language === 'BN' ? topic.titleBn : topic.titleEn}
                </span>
                {weak && <span className="progress__flag">{t('review')}</span>}
              </div>

              <div className="progress__bar is-small">
                <span
                  className={weak ? 'is-weak' : ''}
                  style={{ width: `${topic.completionPercent}%` }}
                />
              </div>

              <div className="progress__meta">
                <span>
                  {num(topic.completedLessons)}/{num(topic.lessonCount)}{' '}
                  {t('lessons')}
                </span>
                {/* null means "not attempted", which is not the same as 0%. */}
                {topic.scoreAvg !== null && (
                  <span>
                    {t('score')}: {num(Math.round(topic.scoreAvg))}%
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {currentLessonId != null && onMarkComplete && (
        <button
          type="button"
          className="progress__complete"
          onClick={onMarkComplete}
          disabled={currentLessonCompleted}
        >
          {currentLessonCompleted ? t('done') : t('markDone')}
        </button>
      )}
    </section>
  )
}
