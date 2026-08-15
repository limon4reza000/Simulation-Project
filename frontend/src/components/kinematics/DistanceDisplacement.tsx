import { useCallback, useMemo, useState } from 'react'
import {
  totalLength,
  stateAtDistance,
  type Point,
} from '../../lib/kinematics/pathGeometry'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * VIZ_DISTANCE_DISPLACEMENT — চিত্র ২.০৪
 *
 * Digitises the book's winding-path figure (p. 39): a slider walks a point
 * along a curved route while distance travelled (path length so far) and
 * displacement (straight line from the start) update live. The book's point —
 * that distance only accumulates while displacement can shrink — is meant to
 * be felt by dragging past the bend, not just read as two numbers.
 *
 * The default path is constructed to match the book's own two printed
 * relationships exactly (distance 4 km / displacement 3 km at one point,
 * distance 6 km / displacement 1.5 km further on) — see
 * lib/kinematics/pathGeometry.test.ts for the derivation.
 */

const VIEW_W = 900
const VIEW_H = 320
const SCALE = 90 // px per km, for a path defined in book-relationship units
const ORIGIN_X = 120
const ORIGIN_Y = 240

function defaultPath(): Point[] {
  const A: Point = { x: 0, y: 0 }
  const M: Point = { x: 1.5, y: Math.sqrt(4 - 1.5 ** 2) }
  const B: Point = { x: 3, y: 0 }
  const C: Point = { x: 7.25 / 6, y: Math.sqrt(2.25 - (7.25 / 6) ** 2) }
  return [A, M, B, C]
}

interface Config {
  path?: Point[]
}

interface Params {
  distanceKm?: number
}

const L = {
  title: { bn: 'দূরত্ব ও সরণ', en: 'Distance and Displacement' },
  walk: { bn: 'কতদূর হাঁটলে', en: 'Distance walked' },
  distance: { bn: 'দূরত্ব (স্কেলার)', en: 'Distance (scalar)' },
  displacement: { bn: 'সরণ (ভেক্টর)', en: 'Displacement (vector)' },
  direction: { bn: 'দিক', en: 'Direction' },
  note: {
    bn: 'দূরত্ব শুধু বাড়ে; সরণ কমতেও পারে।',
    en: 'Distance only ever grows; displacement can shrink.',
  },
} as const

type LabelKey = keyof typeof L

export default function DistanceDisplacement({
  config,
  parameters,
  language = 'BN',
  onActivity,
}: RendererProps<Config, Params>) {
  const cfg = (config ?? {}) as Config
  const params = (parameters ?? {}) as Params

  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (v: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(v), 'BN') : String(v),
    [language],
  )

  const path = useMemo(() => cfg.path ?? defaultPath(), [cfg.path])
  const max = useMemo(() => totalLength(path), [path])
  const [distance, setDistance] = useState(params.distanceKm ?? 0)

  const onChange = useCallback(
    (next: number) => {
      setDistance(next)
      // Reported sparingly — only when the walker actually reaches a stop the
      // book names, not on every slider tick, to keep the activity stream
      // meaningful rather than a flood of drag events.
      if (next === max) {
        onActivity?.({
          activityType: 'DISTANCE_DISPLACEMENT_REACHED_END',
          metadata: { distanceKm: next },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [max, onActivity],
  )

  const state = stateAtDistance(path, distance)

  const toScreen = useCallback(
    (p: Point) => ({ x: ORIGIN_X + p.x * SCALE, y: ORIGIN_Y - p.y * SCALE }),
    [],
  )

  const pathPoints = path.map((p) => toScreen(p)).map((p) => `${p.x},${p.y}`).join(' ')
  const start = toScreen(path[0])
  const current = toScreen(state.point)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        {/* the full path, faint */}
        <polyline points={pathPoints} className="sim__curve" fill="none" opacity={0.4} />

        {/* displacement vector: straight line, start to current */}
        <line
          x1={start.x}
          y1={start.y}
          x2={current.x}
          y2={current.y}
          className="sim__marker"
        />

        {/* start and current markers */}
        <circle cx={start.x} cy={start.y} r={7} className="sim__dot" />
        <text x={start.x - 4} y={start.y + 24} className="sim__axisLabel">
          A
        </text>
        <circle cx={current.x} cy={current.y} r={9} className="sim__object" />
      </svg>

      <label className="sim__control">
        {t('walk')} (km)
        <input
          type="range"
          min={0}
          max={max}
          step={0.05}
          value={distance}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>

      <div className="sim__panel">
        <Readout
          label={t('distance')}
          value={`${num(state.distanceTravelled.toFixed(2))} km`}
          emphasis
        />
        <Readout
          label={t('displacement')}
          value={`${num(state.displacement.magnitude.toFixed(2))} km`}
          emphasis
        />
        <Readout label={t('direction')} value={`${num(state.displacement.angleDeg.toFixed(0))}°`} />
      </div>

      <p className="sim__note">{t('note')}</p>
    </figure>
  )
}

function Readout({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className={`sim__readout ${emphasis ? 'is-emphasis' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
