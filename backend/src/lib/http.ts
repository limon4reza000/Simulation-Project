import { z } from 'zod'
import { Language } from '@prisma/client'
import { HttpError } from './errors'

/** Route params arrive as strings; ids must be positive integers. */
const idSchema = z.coerce.number().int().positive()

export function parseId(raw: unknown, what: string): number {
  const result = idSchema.safeParse(raw)
  if (!result.success) {
    throw HttpError.badRequest(`Invalid ${what} id`)
  }
  return result.data
}

/**
 * Resolves the response language from `?lang=`, falling back to Bangla.
 *
 * Bangla is the default rather than English: this platform's primary audience
 * reads Bangla, and defaulting the other way would quietly make English the
 * norm in every untagged request.
 */
export function parseLanguage(raw: unknown): Language {
  return String(raw ?? '').toUpperCase() === 'EN' ? Language.EN : Language.BN
}

/** Only published, non-deleted rows are ever visible to a student. */
export const publishedOnly = {
  status: 'PUBLISHED',
  deletedAt: null,
} as const
