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

export interface ChapterHeading {
  titleBn: string
  titleEn: string
}

export function useLessonSource() {
  const [source, setSource] = useState<LessonSource>('loading')
  const [index, setIndex] = useState<LessonIndexEntry[]>([])
  const [chapterId, setChapterId] = useState<number | null>(null)
  const [chapterHeading, setChapterHeading] = useState<ChapterHeading | null>(null)

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
        // Not classes[0]: with classes 6-10 all enrollable and only 9-10
        // carrying Physics, the first class by level is frequently one with no
        // subjects at all, which silently dropped the app to fixtures for
        // every real student. Find the first class that actually has a
        // subject instead of assuming the lowest level does.
        const subject = classes.flatMap((c) => c.subjects)[0]
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
        setChapterId(chapter.id)
        setChapterHeading({ titleBn: chapter.titleBn, titleEn: chapter.titleEn })
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
      const fixture = chapter01Lessons.find((l) => l.id === lessonId)
      return fixture ? localiseFixture(fixture, language) : undefined
    },
    [source],
  )

  return { source, index, chapterId, chapterHeading, loadLesson }
}

/**
 * The API localises quiz text server-side, so a live LessonSpec already carries
 * one `text` per option. Fixtures hold both languages, so they need collapsing
 * here — this keeps QuizRunner unaware that fixtures exist.
 */
function localiseFixture(lesson: LessonSpec, language: Language): LessonSpec {
  if (!lesson.components.some((c) => c.rendererType === 'QUIZ_RUNNER')) {
    return lesson
  }

  return {
    ...lesson,
    components: lesson.components.map((component) => {
      if (component.rendererType !== 'QUIZ_RUNNER') return component
      const config = component.config as
        | { questions?: FixtureQuestion[] }
        | undefined
      if (!config?.questions) return component

      return {
        ...component,
        config: {
          ...component.config,
          questions: config.questions.map((question) => ({
            ...question,
            prompt:
              language === 'EN' && question.promptEn
                ? question.promptEn
                : question.prompt,
            options: question.options.map((option) => ({
              key: option.key,
              text:
                language === 'EN' && option.textEn ? option.textEn : option.text,
            })),
          })),
        },
      }
    }),
  }
}

interface FixtureQuestion {
  id: number
  prompt: string
  promptEn?: string
  options: { key: string; text: string; textEn?: string }[]
  [key: string]: unknown
}
