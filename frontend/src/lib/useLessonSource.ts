import { useCallback, useEffect, useState } from 'react'
import {
  checkHealth,
  fetchChapters,
  fetchClasses,
  fetchLesson,
  fetchTopics,
} from './api'
import { chapter01Lessons } from '../data/chapter01'
import type { Language, LessonSpec } from '../registry/types'

/**
 * Resolves lessons from the API, falling back to the bundled fixtures when the
 * API is unreachable.
 *
 * The fallback is a development convenience, not a production pattern — it lets
 * the renderers be worked on without MySQL running. It is deliberately visible
 * in the UI (`source`) so nobody mistakes fixture data for live data, which is
 * exactly the failure mode a silent fallback would create.
 */

export type LessonSource = 'api' | 'fixtures' | 'loading'

export interface LessonIndexEntry {
  id: number
  titleBn: string
  titleEn: string
}

export function useLessonSource() {
  const [source, setSource] = useState<LessonSource>('loading')
  const [index, setIndex] = useState<LessonIndexEntry[]>([])

  useEffect(() => {
    const controller = new AbortController()

    async function resolve() {
      const healthy = await checkHealth(controller.signal)
      if (controller.signal.aborted) return

      if (!healthy) {
        setSource('fixtures')
        setIndex(
          chapter01Lessons.map((l) => ({
            id: l.id,
            titleBn: l.titleBn,
            titleEn: l.titleEn,
          })),
        )
        return
      }

      try {
        const classes = await fetchClasses(controller.signal)
        const subject = classes[0]?.subjects[0]
        if (!subject) throw new Error('no published subject')

        const chapters = await fetchChapters(subject.id, controller.signal)
        const chapter = chapters[0]
        if (!chapter) throw new Error('no published chapter')

        const topics = await fetchTopics(chapter.id, controller.signal)
        if (controller.signal.aborted) return

        const lessons = topics.flatMap((topic) =>
          topic.lessons.map((lesson) => ({
            id: lesson.id,
            titleBn: lesson.titleBn,
            titleEn: lesson.titleEn,
          })),
        )

        if (lessons.length === 0) throw new Error('no published lessons')

        setSource('api')
        setIndex(lessons)
      } catch {
        // The API answered health but the catalog is empty or broken — most
        // likely the seed has not been run. Fixtures keep the UI usable.
        if (controller.signal.aborted) return
        setSource('fixtures')
        setIndex(
          chapter01Lessons.map((l) => ({
            id: l.id,
            titleBn: l.titleBn,
            titleEn: l.titleEn,
          })),
        )
      }
    }

    void resolve()
    return () => controller.abort()
  }, [])

  const loadLesson = useCallback(
    async (
      lessonId: number,
      language: Language,
      signal?: AbortSignal,
    ): Promise<LessonSpec | undefined> => {
      if (source === 'api') {
        return fetchLesson(lessonId, language, signal)
      }
      return chapter01Lessons.find((l) => l.id === lessonId)
    },
    [source],
  )

  return { source, index, loadLesson }
}
