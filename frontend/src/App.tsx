import { useCallback, useState } from 'react'
import LessonRenderer from './components/LessonRenderer'
import { chapter01Lessons } from './data/chapter01'
import { registeredTypes } from './registry/componentRegistry'
import type { ActivityEvent, Language } from './registry/types'
import './styles.css'

/**
 * Development harness for the Chapter 1 renderers.
 *
 * This stands in for the student lesson route until the API exists. It also
 * surfaces the activity stream, so what would be POSTed to
 * /api/simulations/:id/activity is visible while building.
 */
export default function App() {
  const [language, setLanguage] = useState<Language>('BN')
  const [lessonId, setLessonId] = useState(chapter01Lessons[1].id)
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  const lesson =
    chapter01Lessons.find((l) => l.id === lessonId) ?? chapter01Lessons[0]

  const onActivity = useCallback((event: ActivityEvent) => {
    setActivity((current) => [event, ...current].slice(0, 8))
  }, [])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">
            {language === 'BN'
              ? 'পদার্থবিজ্ঞান — ৯ম-১০ম শ্রেণি — প্রথম অধ্যায়'
              : 'Physics — Class 9–10 — Chapter 1'}
          </p>
          <h1 className="app__title">
            {language === 'BN'
              ? 'ভৌত রাশি এবং তাদের পরিমাপ'
              : 'Physical Quantities and Their Measurement'}
          </h1>
        </div>
        <button
          type="button"
          className="app__lang"
          onClick={() => setLanguage((l) => (l === 'BN' ? 'EN' : 'BN'))}
        >
          {language === 'BN' ? 'English' : 'বাংলা'}
        </button>
      </header>

      <nav className="app__nav">
        {chapter01Lessons.map((l) => (
          <button
            key={l.id}
            type="button"
            className={l.id === lessonId ? 'is-active' : ''}
            onClick={() => setLessonId(l.id)}
          >
            {language === 'BN' ? l.titleBn : l.titleEn}
          </button>
        ))}
      </nav>

      <main className="app__main">
        <LessonRenderer
          lesson={lesson}
          language={language}
          onActivity={onActivity}
        />
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
