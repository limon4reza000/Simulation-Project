import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { acceleration, stateAtTime, sampleMotion } from '../../lib/dynamics/newtonsSecondLaw'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_NEWTONS_SECOND_LAW — নিউটনের দ্বিতীয় গতি সূত্র
 *
 * Digitises §৩.৬ (pp. 75–76): a block on a frictionless surface, pushed by one
 * constant force. Live readouts and a v–t plot show a = F/m directly, and the
 * momentum-change readout is the book's own alternate definition of the same
 * law (F = Δp/t) checked against the motion, not just stated beside it.
 *
 * SVG for the usual reason: Bangla labels, and the geometry is one block
 * translating in a straight line — no canvas redraw loop earns its keep here.
 */

const VIEW_W = 900
const VIEW_H = 260
const TRACK_Y = 160
const TRACK_LEFT = 60
const TRACK_RIGHT = 700
const GRAPH_X = 720
const GRAPH_W = 150
const GRAPH_H = 140
const GRAPH_Y = 40

interface Config {
  maxForce?: number
  maxMass?: number
  durationS?: number
}

interface Params {
  forceN?: number
  massKg?: number
}

const L = {
  title: { bn: 'নিউটনের দ্বিতীয় গতি সূত্র', en: "Newton's Second Law" },
  force: { bn: 'বল (F)', en: 'Force (F)' },
  mass: { bn: 'ভর (m)', en: 'Mass (m)' },
  accel: { bn: 'ত্বরণ (a = F/m)', en: 'Acceleration (a = F/m)' },
  velocity: { bn: 'বেগ', en: 'Velocity' },
  momentumChange: { bn: 'ভরবেগের পরিবর্তন (Δp)', en: 'Momentum change (Δp)' },
  vtGraph: { bn: 'বেগ–সময় লেখচিত্র', en: 'Velocity–time graph' },
  push: { bn: 'বল প্রয়োগ করো', en: 'Apply force' },
  reset: { bn: 'আবার শুরু', en: 'Reset' },
  note: {
    bn: 'একই বল দ্বিগুণ ভরের উপর প্রয়োগ করলে ত্বরণ অর্ধেক হয়ে যায়।',
    en: 'The same force on double the mass gives half the acceleration.',
  },
} as const

type LabelKey = keyof typeof L

export default function NewtonsSecondLaw({
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

  const maxForce = cfg.maxForce ?? 50
  const maxMass = cfg.maxMass ?? 20
  const duration = cfg.durationS ?? 4

  const [force, setForce] = useState(params.forceN ?? 10)
  const [mass, setMass] = useState(params.massKg ?? 2)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)

  const a = useMemo(() => acceleration(force, mass), [force, mass])
  const state = useMemo(() => stateAtTime(force, mass, elapsed), [force, mass, elapsed])
  const samples = useMemo(() => sampleMotion(force, mass, duration, 20), [force, mass, duration])

  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now() - elapsed * 1000
    const tick = (now: number) => {
      const next = (now - startRef.current) / 1000
      if (next >= duration) {
        setElapsed(duration)
        setRunning(false)
        onActivity?.({
          activityType: 'NEWTONS_SECOND_LAW_RUN',
          metadata: { forceN: force, massKg: mass, accelerationMs2: a },
          occurredAt: new Date().toISOString(),
        })
        return
      }
      setElapsed(next)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const onPush = useCallback(() => {
    setElapsed(0)
    setRunning(true)
  }, [])

  const onReset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
  }, [])

  // Block position: displacement scaled and clamped so it never leaves the
  // drawn track regardless of how large force/mass push the acceleration.
  const maxDisplacement = 0.5 * acceleration(maxForce, 1) * duration * duration || 1
  const fraction = Math.min(1, state.displacement / maxDisplacement)
  const blockX = TRACK_LEFT + fraction * (TRACK_RIGHT - TRACK_LEFT - 40)

  const maxV = samples[samples.length - 1]?.velocity || 1
  const vPoints = samples
    .map((s) => {
      const x = GRAPH_X + (s.t / duration) * GRAPH_W
      const y = GRAPH_Y + GRAPH_H - (s.velocity / maxV) * GRAPH_H
      return `${x},${y}`
    })
    .join(' ')

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
        <rect x={blockX} y={TRACK_Y - 44} width={40} height={40} className="sim__object" rx={4} />
        {force > 0 && (
          <>
            <line
              x1={blockX - 30}
              y1={TRACK_Y - 24}
              x2={blockX - 4}
              y2={TRACK_Y - 24}
              className="sim__marker"
              markerEnd="url(#arrow)"
            />
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" className="sim__index" />
              </marker>
            </defs>
          </>
        )}

        <text x={GRAPH_X} y={GRAPH_Y - 8} className="sim__axisLabel">
          {t('vtGraph')}
        </text>
        <line x1={GRAPH_X} y1={GRAPH_Y + GRAPH_H} x2={GRAPH_X + GRAPH_W} y2={GRAPH_Y + GRAPH_H} className="sim__datum" />
        <line x1={GRAPH_X} y1={GRAPH_Y} x2={GRAPH_X} y2={GRAPH_Y + GRAPH_H} className="sim__datum" />
        <polyline points={vPoints} className="sim__curve" fill="none" />
        <circle
          cx={GRAPH_X + (Math.min(elapsed, duration) / duration) * GRAPH_W}
          cy={GRAPH_Y + GRAPH_H - (state.velocity / maxV) * GRAPH_H}
          r={4}
          className="sim__dot is-match"
        />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('force')} (N)
          <input
            type="range"
            min={0}
            max={maxForce}
            step={1}
            value={force}
            disabled={running}
            onChange={(e) => {
              onReset()
              setForce(Number(e.target.value))
            }}
          />
        </label>
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={1}
            max={maxMass}
            step={0.5}
            value={mass}
            disabled={running}
            onChange={(e) => {
              onReset()
              setMass(Number(e.target.value))
            }}
          />
        </label>
        <Readout label={t('accel')} value={`${num(a.toFixed(2))} m/s²`} emphasis />
        <Readout label={t('velocity')} value={`${num(state.velocity.toFixed(2))} m/s`} />
        <Readout label={t('momentumChange')} value={`${num(state.momentumChange.toFixed(2))} kg·m/s`} />
      </div>

      <div className="sim__practice">
        <button type="button" onClick={onPush} disabled={running || force === 0}>
          {t('push')}
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
