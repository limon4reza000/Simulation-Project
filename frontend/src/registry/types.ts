import type { ComponentType } from 'react'

/**
 * The contract every interactive component honours.
 *
 * This is the load-bearing abstraction of the whole platform. A renderer never
 * knows which lesson, topic or chapter it sits in — it receives configuration
 * and parameters and reports activity. Adding an instrument therefore touches
 * one registry entry and one component, and no routing, lesson or content code.
 */

/** Mirrors the ComponentType enum in prisma/schema.prisma. */
export type ComponentKind =
  | 'EXPLANATION'
  | 'DIAGRAM'
  | 'VISUALIZATION'
  | 'SIMULATION'
  | 'EXERCISE'
  | 'QUIZ'

export type Language = 'BN' | 'EN'

/**
 * Reported to POST /api/simulations/:id/activity, backing the LearningActivity
 * table. Keep payloads minimal — the users are children, and data minimisation
 * is a stated control, not an afterthought.
 */
export interface ActivityEvent {
  activityType: string
  metadata?: Record<string, unknown>
  occurredAt: string
}

export interface RendererProps<
  TConfig = Record<string, unknown>,
  TParams = Record<string, unknown>,
> {
  /** Static shape of the artefact — the Simulation/Visualization JSON column. */
  config: TConfig
  /** Author-tunable values — the SimulationParameter rows. */
  parameters: TParams
  /** Interface language. Every label in every renderer must respect this. */
  language?: Language
  onActivity?: (event: ActivityEvent) => void
}

/**
 * The erased renderer type the registry stores.
 *
 * Individual components narrow `config` and `parameters` to their own shapes;
 * the registry cannot know those, so entries are cast on the way in. The cast
 * is confined to componentRegistry.ts — everywhere else the contract holds.
 */
export type Renderer = ComponentType<RendererProps>

/** One entry of a lesson's component list, mirroring LessonComponent. */
export interface LessonComponentSpec {
  id: number
  componentType: ComponentKind
  displayOrder: number
  /** Registry key — Simulation.type or Visualization.type. */
  rendererType?: string
  config?: Record<string, unknown>
  parameters?: Record<string, unknown>
  /** For EXPLANATION / DIAGRAM components. */
  bodyBn?: string
  bodyEn?: string
  /** Textbook page this component is validated against. */
  sourcePage?: number
}

export interface LessonSpec {
  id: number
  titleBn: string
  titleEn: string
  components: LessonComponentSpec[]
}
