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
    // The session cookie is httpOnly and cross-origin in development, so every
    // request must opt in to sending it.
    credentials: 'include',
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

/** Reports a simulation interaction. Identity comes from the session cookie. */
export async function postActivity(
  simulationId: number,
  payload: {
    activityType: string
    lessonId?: number
    componentId?: number
    metadata?: Record<string, string | number | boolean>
  },
): Promise<void> {
  await post<{ id: number }>(`/api/simulations/${simulationId}/activity`, payload)
}

export interface CurrentUser {
  userId: number
  name: string
  roleCode: string
  preferredLanguage: string
  isStudent: boolean
}

export function login(email: string, password: string) {
  return post<CurrentUser>('/api/auth/login', { email, password })
}

export function logout() {
  return post<{ ok: boolean }>('/api/auth/logout')
}

export function logoutEverywhere() {
  return post<{ revoked: number }>('/api/auth/logout-all')
}

/** Resolves the current session, or null when not signed in. */
export async function fetchMe(signal?: AbortSignal): Promise<CurrentUser | null> {
  try {
    return await get<CurrentUser>('/api/auth/me', signal)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
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

async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    let code = 'HTTP_ERROR'
    let message = `Request failed with ${response.status}`
    try {
      const errorBody = (await response.json()) as ApiErrorBody
      code = errorBody.error?.code ?? code
      message = errorBody.error?.message ?? message
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, code, message)
  }
  const envelope = (await response.json()) as ApiEnvelope<T>
  return envelope.data
}

/**
 * Starts an attempt and submits it.
 *
 * Two calls rather than one because the attempt row is what enforces the
 * attempt limit and gives the submission something to belong to. Grading is
 * entirely server-side — the client never sees an answer key until the result
 * comes back.
 */
export async function submitQuiz(
  quizId: number,
  responses: Record<string, string>,
  language: Language,
): Promise<QuizResult> {
  const attempt = await post<{ id: number }>(`/api/quizzes/${quizId}/attempts`)
  return post<QuizResult>(
    `/api/attempts/${attempt.id}/submit?lang=${language.toLowerCase()}`,
    { responses },
  )
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    await get<{ status: string }>('/api/health', signal)
    return true
  } catch {
    return false
  }
}
