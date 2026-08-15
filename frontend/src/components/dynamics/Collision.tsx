import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { elasticCollision, inelasticCollision } from '../../lib/dynamics/collision'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_COLLISION — সংঘর্ষ
 *
 * Digitises §৩.৫ (pp. 72–75): two bodies approach head-on at a shared closing
 * speed — the book's own road-safety framing, not a general two-velocity
 * setup — and the renderer shows the post-collision motion the book's formulas
 * predict. The default masses and speed reproduce the book's own truck-and-car
 * figures (v1' ≈ u, v2' ≈ 3u) closely enough to be recognised against the page.
 *
 * SVG for the usual reason: Bangla labels, and the geometry is two circles on
 * a line — nothing here needs a canvas redraw loop.
 */

const VIEW_W = 900
const VIEW_H = 220
const TRACK_Y = 130
const TRACK_LEFT = 60
const TRACK_RIGHT = 840
const MEETING_X = (TRACK_LEFT + TRACK_RIGHT) / 2

interface Config {
  maxMass1?: number
  maxMass2?: number
  maxSpeed?: number
}

interface Params {
  mass1?: number
  mass2?: number
  speed?: number
  elastic?: boolean
}

const L = {
  title: { bn: 'সংঘর্ষ', en: 'Collision' },
  mass1: { bn: 'ট্রাক (m₁)', en: 'Truck (m₁)' },
  mass2: { bn: 'গাড়ি (m₂)', en: 'Car (m₂)' },
  speed: { bn: 'বেগ (u)', en: 'Speed (u)' },
  elastic: { bn: 'স্থিতিস্থাপক সংঘর্ষ', en: 'Elastic collision' },
  v1: { bn: 'ট্রাকের বেগ পরে', en: "Truck's velocity after" },
  v2: { bn: 'গাড়ির বেগ পরে', en: "Car's velocity after" },
  momentum: { bn: 'ভরবেগ সংরক্ষিত', en: 'Momentum conserved' },
  collide: { bn: 'সংঘর্ষ ঘটাও', en: 'Run collision' },
  reset: { bn: 'আবার শুরু', en: 'Reset' },
  note: {
    bn: 'গাড়ির ভর ট্রাকের তুলনায় খুব কম হলে ট্রাকের বেগ প্রায় একই থাকে, কিন্তু গাড়ি তিনগুণ বেগে ছিটকে যায়।',
    en: "When the car's mass is much smaller than the truck's, the truck barely slows — but the car rebounds at three times the speed.",
  },
} as const

type LabelKey = keyof typeof L

export default function Collision({
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

  const maxMass1 = cfg.maxMass1 ?? 5000
  const maxMass2 = cfg.maxMass2 ?? 2000
  const maxSpeed = cfg.maxSpeed ?? 20

  const [mass1, setMass1] = useState(params.mass1 ?? 5000)
  const [mass2, setMass2] = useState(params.mass2 ?? 50)
  const [speed, setSpeed] = useState(params.speed ?? 10)
  const [elastic, setElastic] = useState(params.elastic ?? true)
  const [progress, setProgress] = useState(0) // 0 = start, 1 = fully separated after impact
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const result = useMemo(() => {
    const fn = elastic ? elasticCollision : inelasticCollision
    return fn(mass1, speed, mass2, -speed)
  }, [mass1, mass2, speed, elastic])

  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef(0)
  const DURATION_MS = 2400

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - startRef.current) / DURATION_MS)
      setProgress(p)
      if (p >= 1) {
        setRunning(false)
        setDone(true)
        onActivity?.({
          activityType: 'COLLISION_RUN',
          metadata: { mass1, mass2, speed, elastic },
          occurredAt: new Date().toISOString(),
        })
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const onRun = useCallback(() => {
    setProgress(0)
    setDone(false)
    setRunning(true)
  }, [])

  const onReset = useCallback(() => {
    setRunning(false)
    setProgress(0)
    setDone(false)
  }, [])

  // Approach phase (progress 0 -> 0.5): each body travels from its start
  // toward the meeting point at its pre-collision speed. Separation phase
  // (0.5 -> 1): each travels onward at its post-collision speed. Positions
  // agree exactly at progress = 0.5, so the animation never jumps.
  const startGap = 320
  const preFraction = Math.min(0.5, progress) * 2
  const postFraction = Math.max(0, progress - 0.5) * 2

  const x1Start = MEETING_X - startGap
  const x2Start = MEETING_X + startGap
  const x1 = running || progress > 0
    ? progress <= 0.5
      ? x1Start + (MEETING_X - x1Start) * preFraction
      : MEETING_X + result.body1.velocity * 12 * postFraction
    : x1Start
  const x2 = running || progress > 0
    ? progress <= 0.5
      ? x2Start + (MEETING_X - x2Start) * preFraction
      : MEETING_X + result.body2.velocity * 12 * postFraction
    : x2Start

  const r1 = Math.max(14, Math.min(40, 10 + Math.sqrt(mass1) / 8))
  const r2 = Math.max(10, Math.min(40, 10 + Math.sqrt(mass2) / 8))

  // Relative tolerance, not absolute: momentum here ranges from single digits
  // to tens of thousands depending on the chosen masses, and a fixed absolute
  // epsilon that looks safe for small numbers silently fails for large ones —
  // exactly the bug this line replaced. See the note in collision.ts.
  const momentumOk =
    Math.abs(result.momentumAfter - result.momentumBefore) <
    Math.max(1e-6, Math.abs(result.momentumBefore) * 1e-6)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <line x1={TRACK_LEFT} y1={TRACK_Y} x2={TRACK_RIGHT} y2={TRACK_Y} className="sim__datum" />
        <line
          x1={MEETING_X}
          y1={TRACK_Y - 50}
          x2={MEETING_X}
          y2={TRACK_Y + 10}
          className="sim__tick"
          strokeDasharray="4 3"
        />
        <circle cx={Math.max(TRACK_LEFT, Math.min(TRACK_RIGHT, x1))} cy={TRACK_Y - r1} r={r1} className="sim__object" />
        <circle cx={Math.max(TRACK_LEFT, Math.min(TRACK_RIGHT, x2))} cy={TRACK_Y - r2} r={r2} className="sim__dot is-match" />
        <text x={x1Start} y={TRACK_Y + 30} className="sim__axisLabel" textAnchor="middle">
          {t('mass1')}
        </text>
        <text x={x2Start} y={TRACK_Y + 30} className="sim__axisLabel" textAnchor="middle">
          {t('mass2')}
        </text>
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('mass1')} (kg)
          <input
            type="range"
            min={200}
            max={maxMass1}
            step={100}
            value={mass1}
            disabled={running}
            onChange={(e) => {
              onReset()
              setMass1(Number(e.target.value))
            }}
          />
        </label>
        <label className="sim__control">
          {t('mass2')} (kg)
          <input
            type="range"
            min={10}
            max={maxMass2}
            step={10}
            value={mass2}
            disabled={running}
            onChange={(e) => {
              onReset()
              setMass2(Number(e.target.value))
            }}
          />
        </label>
        <label className="sim__control">
          {t('speed')} (m/s)
          <input
            type="range"
            min={1}
            max={maxSpeed}
            step={0.5}
            value={speed}
            disabled={running}
            onChange={(e) => {
              onReset()
              setSpeed(Number(e.target.value))
            }}
          />
        </label>
      </div>

      <label className="sim__remember" style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={elastic}
          disabled={running}
          onChange={(e) => {
            onReset()
            setElastic(e.target.checked)
          }}
        />
        <span className="sim__note" style={{ margin: 0 }}>
          {t('elastic')}
        </span>
      </label>

      {done && (
        <div className="sim__panel" style={{ marginTop: 10 }}>
          <Readout label={t('v1')} value={`${num(result.body1.velocity.toFixed(2))} m/s`} emphasis />
          <Readout label={t('v2')} value={`${num(result.body2.velocity.toFixed(2))} m/s`} emphasis />
          <Readout label={t('momentum')} value={momentumOk ? '✓' : '✗'} />
        </div>
      )}

      <div className="sim__practice">
        <button type="button" onClick={onRun} disabled={running}>
          {t('collide')}
        </button>
        <button type="button" className="is-secondary" onClick={onReset}>
          {t('reset')}
        </button>
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
