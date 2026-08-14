import VernierCaliper from '../components/instruments/VernierCaliper'
import ScrewGauge from '../components/instruments/ScrewGauge'
import ErrorPropagationLab from '../components/measurement/ErrorPropagationLab'
import LogScaleExplorer from '../components/viz/LogScaleExplorer'
import QuizRunner from '../components/assessment/QuizRunner'
import type { Renderer } from './types'

/**
 * The component registry.
 *
 * `Simulation.type` and `Visualization.type` in the database are keys into this
 * map. Adding an interactive artefact means writing one component and adding
 * one line here — no lesson, topic, routing or content code is touched. That
 * invariant is the architectural claim the project rests on, so keep this file
 * boring: no conditionals, no per-subject special cases.
 *
 * Keys must match the seeded `type` values exactly. `npm run test` covers the
 * round trip so a rename cannot silently break a published lesson.
 */
export const componentRegistry: Record<string, Renderer> = {
  SIM_VERNIER_CALIPER: VernierCaliper as unknown as Renderer,
  SIM_SCREW_GAUGE: ScrewGauge as unknown as Renderer,
  SIM_ERROR_PROPAGATION: ErrorPropagationLab as unknown as Renderer,
  VIZ_LOG_SCALE_EXPLORER: LogScaleExplorer as unknown as Renderer,
  QUIZ_RUNNER: QuizRunner as unknown as Renderer,
}

export function resolveRenderer(type: string | undefined): Renderer | undefined {
  if (!type) return undefined
  return componentRegistry[type]
}

export function registeredTypes(): string[] {
  return Object.keys(componentRegistry).sort()
}
