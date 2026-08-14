import { Prisma, ParameterDataType, type Language } from '@prisma/client'
import { mapQuizForStudent, quizInclude } from './quiz'

/**
 * Maps database rows onto the LessonSpec shape the frontend renderers already
 * consume (frontend/src/registry/types.ts). Keeping the contract identical to
 * the fixtures in frontend/src/data/chapter01.ts means switching from fixture
 * to API changes only where the data comes from, not what components receive.
 */

export const lessonDetailInclude = {
  components: {
    orderBy: { displayOrder: 'asc' },
    include: {
      // Only versions that are actually live in some language.
      content: {
        include: { versions: { where: { publishedForLanguage: { not: null } } } },
      },
      visualization: true,
      simulation: { include: { parameters: true } },
      exercise: true,
      quiz: { include: quizInclude },
    },
  },
} satisfies Prisma.LessonInclude

export type LessonWithComponents = Prisma.LessonGetPayload<{
  include: typeof lessonDetailInclude
}>

export interface ApiLessonComponent {
  id: number
  componentType: string
  displayOrder: number
  rendererType?: string
  config?: Record<string, unknown>
  parameters?: Record<string, unknown>
  bodyBn?: string
  bodyEn?: string
  sourcePage?: number
  /** Present for SIMULATION components — the target of the activity endpoint. */
  simulationId?: number
}

export interface ApiLesson {
  id: number
  titleBn: string
  titleEn: string
  components: ApiLessonComponent[]
}

/** SimulationParameter stores every value as text; restore its declared type. */
export function coerceParameter(
  dataType: ParameterDataType,
  raw: string,
): string | number | boolean {
  switch (dataType) {
    case ParameterDataType.INT: {
      const value = Number.parseInt(raw, 10)
      return Number.isNaN(value) ? raw : value
    }
    case ParameterDataType.FLOAT: {
      const value = Number.parseFloat(raw)
      return Number.isNaN(value) ? raw : value
    }
    case ParameterDataType.BOOLEAN:
      return raw === 'true' || raw === '1'
    case ParameterDataType.ENUM:
    default:
      return raw
  }
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function mapLesson(
  lesson: LessonWithComponents,
  language: Language,
): ApiLesson {
  return {
    id: lesson.id,
    titleBn: lesson.titleBn,
    titleEn: lesson.titleEn,
    components: lesson.components.map((component) => {
      const base: ApiLessonComponent = {
        id: component.id,
        componentType: component.componentType,
        displayOrder: component.displayOrder,
      }

      if (component.content) {
        // Prefer the requested language, but fall back rather than render an
        // empty lesson: a missing Bangla translation should still show English.
        const versions = component.content.versions
        const preferred =
          versions.find((v) => v.publishedForLanguage === language) ?? versions[0]

        if (preferred) {
          const body = preferred.body
          if (preferred.publishedForLanguage === 'BN') base.bodyBn = body
          else base.bodyEn = body
          // Give the renderer something in both slots so it never blanks.
          base.bodyBn ??= body
          base.bodyEn ??= body
        }
        return base
      }

      const overrides = asRecord(component.parameterOverrides)

      if (component.visualization) {
        base.rendererType = component.visualization.type
        base.config = asRecord(component.visualization.configuration)
        base.parameters = overrides
        return base
      }

      if (component.simulation) {
        base.rendererType = component.simulation.type
        base.simulationId = component.simulation.id
        base.config = asRecord(component.simulation.configuration)
        const defaults: Record<string, unknown> = {}
        for (const parameter of component.simulation.parameters) {
          defaults[parameter.name] = coerceParameter(
            parameter.dataType,
            parameter.defaultValue,
          )
        }
        // Placement overrides win over the simulation's own defaults.
        base.parameters = { ...defaults, ...overrides }
        return base
      }

      if (component.exercise) {
        const config = asRecord(component.exercise.configuration)
        // An exercise names its own renderer in configuration, so drag-and-drop
        // and instrument-practice activities can coexist under one type.
        if (typeof config.rendererType === 'string') {
          base.rendererType = config.rendererType
        }
        base.config = config
        base.parameters = overrides
        return base
      }

      if (component.quiz) {
        base.rendererType = 'QUIZ_RUNNER'
        // Questions travel with the lesson so the client needs no second
        // round-trip. Routed through the same student-facing mapper as
        // GET /api/quizzes/:id, so the answer key cannot leak by this path
        // either.
        base.config = {
          ...mapQuizForStudent(component.quiz, language),
          quizId: component.quiz.id,
        }
        base.parameters = overrides
        return base
      }

      return base
    }),
  }
}
