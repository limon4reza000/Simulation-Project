import type { LessonSpec, Language } from '../registry/types'

/**
 * Thin client for the lesson API.
 *
 * The server returns exactly the LessonSpec shape the renderers consume, so
 * this module does no reshaping — if it ever needs to, that is a signal the
 * contract has drifted and the mapper on the server should be fixed instead.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface ApiEnvelope<T> {
  data: T
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown }
}

export class ApiError extends Error {
  // Written as plain fields rather than constructor parameter properties:
  // the frontend tsconfig enables `erasableSyntaxOnly`, which forbids the
  // shorthand because it emits runtime code.
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let code = 'HTTP_ERROR'
    let message = `Request failed with ${response.status}`
    try {
      const body = (await response.json()) as ApiErrorBody
      code = body.error?.code ?? code
      message = body.error?.message ?? message
    } catch {
      // Non-JSON error body (a proxy or a crash) — keep the generic message.
    }
    throw new ApiError(response.status, code, message)
  }

  const body = (await response.json()) as ApiEnvelope<T>
  return body.data
}

export interface ClassSummary {
  id: number
  level: number
  nameBn: string
  nameEn: string
  subjects: { id: number; code: string; nameBn: string; nameEn: string }[]
}

export interface TopicSummary {
  id: number
  titleBn: string
  titleEn: string
  displayOrder: number
  lessons: { id: number; titleBn: string; titleEn: string; displayOrder: number }[]
}

export function fetchClasses(signal?: AbortSignal) {
  return get<ClassSummary[]>('/api/classes', signal)
}

export interface ChapterSummary {
  id: number
  titleBn: string
  titleEn: string
  displayOrder: number
}

export function fetchChapters(subjectId: number, signal?: AbortSignal) {
  return get<ChapterSummary[]>(`/api/subjects/${subjectId}/chapters`, signal)
}

export function fetchTopics(chapterId: number, signal?: AbortSignal) {
  return get<TopicSummary[]>(`/api/chapters/${chapterId}/topics`, signal)
}

export function fetchLesson(
  lessonId: number,
  language: Language,
  signal?: AbortSignal,
) {
  return get<LessonSpec>(
    `/api/lessons/${lessonId}?lang=${language.toLowerCase()}`,
    signal,
  )
}

/**
 * Reports a simulation interaction.
 *
 * `x-student-id` is the server's development identity shim and is only honoured
 * when the API runs with ALLOW_HEADER_IDENTITY=true. It disappears when session
 * auth lands — do not build anything on top of it.
 */
export async function postActivity(
  simulationId: number,
  payload: {
    activityType: string
    lessonId?: number
    componentId?: number
    metadata?: Record<string, string | number | boolean>
  },
): Promise<void> {
  const studentId = import.meta.env.VITE_STUDENT_ID
  const response = await fetch(
    `${BASE_URL}/api/simulations/${simulationId}/activity`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(studentId ? { 'x-student-id': String(studentId) } : {}),
      },
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new ApiError(response.status, 'ACTIVITY_FAILED', 'Could not record activity')
  }
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    await get<{ status: string }>('/api/health', signal)
    return true
  } catch {
    return false
  }
}
