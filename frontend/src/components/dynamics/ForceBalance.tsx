import { useCallback, useMemo, useState } from 'react'
import { resultant, isBalanced, type Vector } from '../../lib/dynamics/forceBalance'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * VIZ_FORCE_BALANCE — বলের সাম্যাবস্থা ও অসাম্যাবস্থা
 *
 * Digitises §৩.৩ (pp. 69–70): two or three forces act on a point; their
 * resultant — magnitude and direction both, since the book insists force is a
 * vector — updates live as each is adjusted, and the object visibly stays
 * still exactly when the book's equilibrium condition holds (resultant ≈ 0).
 */

const VIEW_W = 900
const VIEW_H = 360
const CX = 450
const CY = 190
const SCALE = 10 // px per newton

interface Config {
  forceCount?: 2 | 3
}

interface Params {
  forces?: { magnitude: number; angleDeg: number }[]
}

const L = {
  title: { bn: 'বলের সাম্যাবস্থা ও অসাম্যাবস্থা', en: 'Balanced and Unbalanced Forces' },
  force: { bn: 'বল', en: 'Force' },
  magnitude: { bn: 'মান', en: 'Magnitude' },
  direction: { bn: 'দিক', en: 'Direction' },
  resultant: { bn: 'লব্ধি বল', en: 'Resultant force' },
  status: { bn: 'অবস্থা', en: 'Status' },
  balanced: { bn: 'সাম্যাবস্থা — কোনো ত্বরণ নেই', en: 'Balanced — no acceleration' },
  unbalanced: { bn: 'অসাম্যাবস্থা — বস্তু ত্বরিত হবে', en: 'Unbalanced — the body accelerates' },
} as const

type LabelKey = keyof typeof L

const STROKES = ['sim__force-a', 'sim__force-b', 'sim__force-c'] as const

export default function ForceBalance({
  config,
  parameters,
  language = 'BN',
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

  const count = cfg.forceCount ?? 3
  const defaults = useMemo<Vector[]>(
    () =>
      params.forces ??
      (count === 2
        ? [
            { magnitude: 8, angleDeg: 20 },
            { magnitude: 8, angleDeg: 200 },
          ]
        : [
            { magnitude: 6, angleDeg: 45 },
            { magnitude: 6, angleDeg: 135 },
            { magnitude: 8.5, angleDeg: 270 },
          ]),
    [params.forces, count],
  )

  const [forces, setForces] = useState<Vector[]>(defaults)

  const updateForce = useCallback((index: number, next: Partial<Vector>) => {
    setForces((current) =>
      current.map((f, i) => (i === index ? { ...f, ...next } : f)),
    )
  }, [])

  const r = useMemo(() => resultant(forces), [forces])
  const balanced = isBalanced(forces)

  const toXY = useCallback((v: Vector, originX = CX, originY = CY) => {
    const rad = (v.angleDeg * Math.PI) / 180
    return {
      x: originX + v.magnitude * SCALE * Math.cos(rad),
      y: originY - v.magnitude * SCALE * Math.sin(rad),
    }
  }, [])

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <defs>
          <marker id="fb-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" className="sim__index" />
          </marker>
        </defs>

        {/* the object: still (square) if balanced, nudged (offset) if not */}
        <rect
          x={CX - 16 + (balanced ? 0 : 10)}
          y={CY - 16}
          width={32}
          height={32}
          className={balanced ? 'sim__object' : 'sim__object is-weak'}
          rx={5}
        />

        {forces.map((f, i) => {
          const end = toXY(f)
          return (
            <g key={i}>
              <line
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                className={STROKES[i % STROKES.length]}
                strokeWidth={3}
                markerEnd="url(#fb-arrow)"
              />
              <text
                x={end.x}
                y={end.y - 8}
                className="sim__axisLabel"
                textAnchor="middle"
              >
                {t('force')} {num(i + 1)}
              </text>
            </g>
          )
        })}

        {/* the resultant, dashed */}
        {r.magnitude > 0.05 && (
          <line
            x1={CX}
            y1={CY}
            x2={toXY(r).x}
            y2={toXY(r).y}
            className="sim__marker"
            markerEnd="url(#fb-arrow)"
          />
        )}
      </svg>

      <div className="sim__panel">
        {forces.map((f, i) => (
          <div key={i} className="sim__sliderRow">
            <span className="sim__sliderLabel">
              {t('force')} {num(i + 1)}
            </span>
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={f.magnitude}
              aria-label={`${t('force')} ${i + 1} ${t('magnitude')}`}
              onChange={(e) => updateForce(i, { magnitude: Number(e.target.value) })}
            />
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={f.angleDeg}
              aria-label={`${t('force')} ${i + 1} ${t('direction')}`}
              onChange={(e) => updateForce(i, { angleDeg: Number(e.target.value) })}
            />
            <output className="sim__sliderValue">
              {num(f.magnitude)} N, {num(f.angleDeg)}°
            </output>
          </div>
        ))}
      </div>

      <div className="sim__panel">
        <Readout
          label={t('resultant')}
          value={`${num(r.magnitude.toFixed(2))} N`}
          emphasis
        />
        <Readout
          label={t('status')}
          value={balanced ? t('balanced') : t('unbalanced')}
          emphasis={!balanced}
        />
      </div>
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
