import { useCallback, useEffect, useState } from 'react'
import LessonRenderer from './components/LessonRenderer'
import { useLessonSource } from './lib/useLessonSource'
import {
  postActivity,
  submitQuiz,
  fetchChapterProgress,
  recordLessonProgress,
  type ChapterProgress,
} from './lib/api'
import ProgressPanel from './components/progress/ProgressPanel'
import { useAuth } from './auth/AuthContext'
import { gradeLocally } from './data/chapter01Quiz'
import { registeredTypes } from './registry/componentRegistry'
import type { ActivityEvent, Language, LessonSpec } from './registry/types'
import './styles.css'

/**
 * Student dashboard.
 *
 * Reads from the API when it is reachable and falls back to bundled fixtures
 * when it is not, so the renderers stay workable without MySQL. The active
 * source is shown in the header — a silent fallback would be worse than no
 * fallback, because fixture data would be mistaken for live data.
 */
interface Props {
  language: Language
  onLanguageChange: (language: Language) => void
}

export default function StudentDashboard({ language, onLanguageChange }: Props) {
  const { source, index, chapterId, chapterHeading, loadLesson } = useLessonSource()
  // Session state is owned by AuthProvider; this page only reads it.
  const { user, signOut } = useAuth()
  const [lessonId, setLessonId] = useState<number | null>(null)
  const [lesson, setLesson] = useState<LessonSpec | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [progress, setProgress] = useState<ChapterProgress | null>(null)

  const refreshProgress = useCallback(async () => {
    if (source !== 'api' || !user?.isStudent || chapterId == null) {
      setProgress(null)
      return
    }
    try {
      setProgress(await fetchChapterProgress(chapterId))
    } catch {
      // Progress is a supporting panel; failing to load it must not take the
      // lesson down with it.
      setProgress(null)
    }
  }, [source, user, chapterId])

  useEffect(() => {
    void refreshProgress()
  }, [refreshProgress])

  // Pick an initial lesson once the catalog resolves.
  useEffect(() => {
    if (lessonId === null && index.length > 0) {
      setLessonId(index[0].id)
    }
  }, [index, lessonId])

  useEffect(() => {
    if (lessonId === null) return
    const controller = new AbortController()

    setError(null)
    loadLesson(lessonId, language, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return
        setLesson(next ?? null)
        if (!next) setError('Lesson not found')
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : 'Could not load lesson')
      })

    return () => controller.abort()
  }, [lessonId, language, loadLesson])

  const onActivity = useCallback(
    (event: ActivityEvent) => {
      setActivity((current) => [event, ...current].slice(0, 8))

      // Only report upstream when there is a real simulation behind it.
      if (source !== 'api' || !event.simulationId || !user) return
      postActivity(event.simulationId, {
        activityType: event.activityType,
        lessonId: lessonId ?? undefined,
        componentId: event.componentId,
        metadata: event.metadata as Record<string, string | number | boolean>,
      }).catch(() => {
        // Losing an analytics event must never interrupt a lesson.
      })
    },
    [source, lessonId, user],
  )

  const onMarkComplete = useCallback(async () => {
    if (lessonId == null || source !== 'api' || !user?.isStudent) return
    try {
      await recordLessonProgress(lessonId, 'COMPLETED')
      await refreshProgress()
    } catch {
      // Ignore: the student can retry, and progress is derived so nothing is lost.
    }
  }, [lessonId, source, user, refreshProgress])

  const onQuizSubmit = useCallback(
    async (quizId: number, responses: Record<string, string>) => {
      if (source === 'api') {
        const outcome = await submitQuiz(quizId, responses, language)
        // A score changes topic progress, so pull the panel back in step.
        void refreshProgress()
        return outcome
      }
      // Offline harness only. The real key never reaches the browser.
      const local = gradeLocally(responses)
      return {
        ...local,
        results: local.results.map((row) => ({
          ...row,
          explanation:
            language === 'BN' ? row.explanationBn : row.explanationEn,
        })),
      }
    },
    [source, language, refreshProgress],
  )

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">
            {language === 'BN' ? 'পদার্থবিজ্ঞান — ৯ম-১০ম শ্রেণি' : 'Physics — Class 9–10'}
          </p>
          <h1 className="app__title">
            {chapterHeading
              ? language === 'BN'
                ? chapterHeading.titleBn
                : chapterHeading.titleEn
              : language === 'BN'
                ? 'ভৌত রাশি এবং তাদের পরিমাপ'
                : 'Physical Quantities and Their Measurement'}
          </h1>
          <p className={`app__source is-${source}`}>
            {source === 'loading'
              ? '…'
              : source === 'api'
                ? language === 'BN'
                  ? 'সার্ভার থেকে'
                  : 'live from API'
                : // Do not claim the server is down: the fallback also fires
                  // when the API is up but the catalog is empty (unseeded
                  // database), which is the common case in development.
                  language === 'BN'
                  ? 'নমুনা তথ্য'
                  : 'fixture data'}
          </p>
        </div>
        <div className="app__actions">
          {user && (
            <>
              <span className="app__user">{user.name}</span>
              <button type="button" className="app__lang" onClick={() => void signOut()}>
                {language === 'BN' ? 'সাইন আউট' : 'Sign out'}
              </button>
            </>
          )}
          <button
            type="button"
            className="app__lang"
            onClick={() => onLanguageChange(language === 'BN' ? 'EN' : 'BN')}
          >
            {language === 'BN' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </header>

      <nav className="app__nav">
        {index.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === lessonId ? 'is-active' : ''}
            onClick={() => setLessonId(entry.id)}
          >
            {language === 'BN' ? entry.titleBn : entry.titleEn}
          </button>
        ))}
      </nav>

      <main className="app__main">
        {error && <p className="app__error">{error}</p>}
        {progress && (
          <ProgressPanel
            progress={progress}
            language={language}
            currentLessonId={lessonId}
            currentLessonCompleted={false}
            onMarkComplete={onMarkComplete}
          />
        )}
        {lesson ? (
          <LessonRenderer
            lesson={lesson}
            language={language}
            onActivity={onActivity}
            onQuizSubmit={onQuizSubmit}
          />
        ) : (
          !error && <p>{language === 'BN' ? 'লোড হচ্ছে…' : 'Loading…'}</p>
        )}
      </main>

      <footer className="app__footer">
        <details>
          <summary>
            {language === 'BN' ? 'রেজিস্ট্রি' : 'Registry'} (
            {registeredTypes().length})
          </summary>
          <ul>
            {registeredTypes().map((type) => (
              <li key={type}>
                <code>{type}</code>
              </li>
            ))}
          </ul>
        </details>

        <details open={activity.length > 0}>
          <summary>
            {language === 'BN' ? 'কার্যক্রম' : 'Activity stream'} (
            {activity.length})
          </summary>
          <ul>
            {activity.map((event, i) => (
              <li key={`${event.occurredAt}-${i}`}>
                <code>{event.activityType}</code>{' '}
                {JSON.stringify(event.metadata ?? {})}
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </div>
  )
}
