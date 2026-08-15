import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  G,
  timeToFall,
  fallFraction,
  stateAtTime,
  sampleFall,
} from '../../lib/kinematics/freeFall'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_FREE_FALL — পড়ন্ত বস্তুর সূত্র
 *
 * Digitises Galileo's three laws (book §২.৮, pp. 48–50). A ball drops under g;
 * v–t and h–t curves render live beside it, so "v ∝ t" and "h ∝ t²" — stated in
 * the book as laws — are seen as literal shapes, not just algebra.
 *
 * SVG for the same reason as the Chapter 1 instruments: every label is Bangla,
 * and the two plotted curves are a few dozen points, not thousands of moving
 * particles — nothing here needs a canvas redraw loop.
 */

const VIEW_W = 900
const VIEW_H = 340
const TUBE_X = 150
const TUBE_TOP = 30
const TUBE_BOTTOM = 300
const GRAPH_X = 330
const GRAPH_W = 260
const GRAPH_H = 120

interface Config {
  maxHeightM?: number
}

interface Params {
  heightM?: number
  compareMass?: boolean
  autoplay?: boolean
}

const L = {
  title: { bn: 'পড়ন্ত বস্তুর সূত্র', en: "Galileo's Laws of Falling Bodies" },
  height: { bn: 'উচ্চতা', en: 'Height' },
  drop: { bn: 'ছেড়ে দাও', en: 'Drop' },
  reset: { bn: 'আবার শুরু', en: 'Reset' },
  time: { bn: 'সময়', en: 'Time' },
  velocity: { bn: 'বেগ (v = gt)', en: 'Velocity (v = gt)' },
  distance: { bn: 'দূরত্ব (h = ½gt²)', en: 'Distance (h = ½gt²)' },
  vtGraph: { bn: 'বেগ–সময় লেখচিত্র', en: 'Velocity–time graph' },
  htGraph: { bn: 'দূরত্ব–সময় লেখচিত্র', en: 'Distance–time graph' },
  compare: {
    bn: 'দুটি ভিন্ন ভরের বস্তু একসাথে ছাড়ো (প্রথম সূত্র)',
    en: 'Drop two different masses together (first law)',
  },
  landed: { bn: 'মাটিতে পৌঁছেছে', en: 'Landed' },
} as const

type LabelKey = keyof typeof L

export default function FreeFall({
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

  const maxHeight = cfg.maxHeightM ?? 40
  const [height, setHeight] = useState(params.heightM ?? 20)
  const [compare, setCompare] = useState(params.compareMass ?? false)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)

  const fallTime = useMemo(() => timeToFall(height), [height])
  const state = useMemo(() => stateAtTime(Math.min(elapsed, fallTime)), [
    elapsed,
    fallTime,
  ])
  const landed = elapsed >= fallTime && fallTime > 0

  // rAF-driven playback rather than setInterval, for a smoother drop and to
  // stop cleanly the instant the ball lands.
  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now() - elapsed * 1000
    const tick = (now: number) => {
      const next = (now - startRef.current) / 1000
      if (next >= fallTime) {
        setElapsed(fallTime)
        setRunning(false)
        onActivity?.({
          activityType: 'FREE_FALL_COMPLETED',
          metadata: { heightM: height, fallTimeS: fallTime },
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

  const onDrop = useCallback(() => {
    setElapsed(0)
    setRunning(true)
  }, [])

  const onReset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
  }, [])

  const onHeightChange = useCallback((next: number) => {
    setRunning(false)
    setElapsed(0)
    setHeight(next)
  }, [])

  const fraction = fallFraction(elapsed, height)
  const ballY = TUBE_TOP + fraction * (TUBE_BOTTOM - TUBE_TOP)
  // Second body for the first-law comparison: same equations, so it falls
  // identically regardless of the "mass" label — that agreement is the point.
  const fraction2 = compare ? fraction : null

  const samples = useMemo(() => sampleFall(height, 24), [height])
  const maxV = samples[samples.length - 1]?.velocity || 1
  const maxH = height || 1

  const vPoints = samples
    .map((s) => {
      const x = GRAPH_X + (s.t / fallTime) * GRAPH_W
      const y = TUBE_TOP + GRAPH_H - (s.velocity / maxV) * GRAPH_H
      return `${x},${y}`
    })
    .join(' ')
  const hPoints = samples
    .map((s) => {
      const x = GRAPH_X + (s.t / fallTime) * GRAPH_W
      const y = TUBE_TOP + GRAPH_H + 60 + GRAPH_H - (s.distance / maxH) * GRAPH_H
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
        {/* drop tube */}
        <line
          x1={TUBE_X}
          y1={TUBE_TOP}
          x2={TUBE_X}
          y2={TUBE_BOTTOM}
          className="sim__datum"
        />
        <line
          x1={TUBE_X - 40}
          y1={TUBE_BOTTOM}
          x2={TUBE_X + 40}
          y2={TUBE_BOTTOM}
          className="sim__tick is-match"
        />
        <circle cx={TUBE_X} cy={ballY} r={12} className="sim__object" />
        {compare && fraction2 !== null && (
          <circle
            cx={TUBE_X + 30}
            cy={TUBE_TOP + fraction2 * (TUBE_BOTTOM - TUBE_TOP)}
            r={7}
            className="sim__dot"
          />
        )}
        <text x={TUBE_X} y={TUBE_BOTTOM + 22} className="sim__axisLabel" textAnchor="middle">
          h = {num(height)} m
        </text>

        {/* v-t graph */}
        <text x={GRAPH_X} y={TUBE_TOP - 8} className="sim__axisLabel">
          {t('vtGraph')}
        </text>
        <line
          x1={GRAPH_X}
          y1={TUBE_TOP + GRAPH_H}
          x2={GRAPH_X + GRAPH_W}
          y2={TUBE_TOP + GRAPH_H}
          className="sim__datum"
        />
        <line
          x1={GRAPH_X}
          y1={TUBE_TOP}
          x2={GRAPH_X}
          y2={TUBE_TOP + GRAPH_H}
          className="sim__datum"
        />
        <polyline points={vPoints} className="sim__curve" fill="none" />
        <circle
          cx={GRAPH_X + (Math.min(elapsed, fallTime) / fallTime) * GRAPH_W}
          cy={TUBE_TOP + GRAPH_H - (state.velocity / maxV) * GRAPH_H}
          r={4}
          className="sim__dot is-match"
        />

        {/* h-t graph */}
        <text x={GRAPH_X} y={TUBE_TOP + GRAPH_H + 52} className="sim__axisLabel">
          {t('htGraph')}
        </text>
        <line
          x1={GRAPH_X}
          y1={TUBE_TOP + GRAPH_H + 60 + GRAPH_H}
          x2={GRAPH_X + GRAPH_W}
          y2={TUBE_TOP + GRAPH_H + 60 + GRAPH_H}
          className="sim__datum"
        />
        <line
          x1={GRAPH_X}
          y1={TUBE_TOP + GRAPH_H + 60}
          x2={GRAPH_X}
          y2={TUBE_TOP + GRAPH_H + 60 + GRAPH_H}
          className="sim__datum"
        />
        <polyline points={hPoints} className="sim__curve" fill="none" />
        <circle
          cx={GRAPH_X + (Math.min(elapsed, fallTime) / fallTime) * GRAPH_W}
          cy={TUBE_TOP + GRAPH_H + 60 + GRAPH_H - (state.distance / maxH) * GRAPH_H}
          r={4}
          className="sim__dot is-match"
        />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('height')} (m)
          <input
            type="range"
            min={2}
            max={maxHeight}
            step={0.5}
            value={height}
            disabled={running}
            onChange={(e) => onHeightChange(Number(e.target.value))}
          />
        </label>
        <Readout label={t('time')} value={`${num(state.t.toFixed(2))} s`} />
        <Readout label={t('velocity')} value={`${num(state.velocity.toFixed(2))} m/s`} emphasis />
        <Readout label={t('distance')} value={`${num(state.distance.toFixed(2))} m`} emphasis />
      </div>

      <label className="sim__remember" style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={compare}
          disabled={running}
          onChange={(e) => setCompare(e.target.checked)}
        />
        <span className="sim__note" style={{ margin: 0 }}>
          {t('compare')}
        </span>
      </label>

      <div className="sim__practice">
        <button type="button" onClick={onDrop} disabled={running}>
          {t('drop')}
        </button>
        <button type="button" className="is-secondary" onClick={onReset}>
          {t('reset')}
        </button>
        {landed && <p className="sim__verdict is-correct">{t('landed')}</p>}
      </div>

      <p className="sim__note">g = {num(G)} m/s²</p>
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
