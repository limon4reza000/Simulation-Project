import { useCallback, useMemo, useState } from 'react'
import {
  deriveVelocity,
  deriveAcceleration,
  TABLE_2_01_SET_1,
  TABLE_2_01_SET_2,
  type Sample,
} from '../../lib/kinematics/motionGrapher'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * VIZ_MOTION_GRAPHER — গতি ও লেখচিত্র, চিত্র ২.০৯
 *
 * Digitises the book's own three-panel figure (p. 52): from a distance–time
 * table, derive and plot velocity–time, then acceleration–time. The book does
 * this once, by hand, for one dataset (টেবিল ২.০১, set 1) and leaves the
 * second dataset as a "নিজে করো" exercise — this renderer does both live and
 * lets a reader flip between them, so the derivation is watched rather than
 * taken on faith.
 */

const VIEW_W = 900
const VIEW_H = 380
const PANEL_W = 250
const PANEL_H = 90
const PANEL_X = [40, 340, 640]
const PANEL_Y = 40

const DATASETS: Record<'set1' | 'set2', Sample[]> = {
  set1: TABLE_2_01_SET_1,
  set2: TABLE_2_01_SET_2,
}

interface Config {
  dataset?: 'set1' | 'set2'
}

type Params = Record<string, never>

const L = {
  title: { bn: 'গতি ও লেখচিত্র', en: 'Motion and Graphs' },
  distanceTime: { bn: 'দূরত্ব–সময়', en: 'Distance–time' },
  velocityTime: { bn: 'বেগ–সময়', en: 'Velocity–time' },
  accelTime: { bn: 'ত্বরণ–সময়', en: 'Acceleration–time' },
  set1: { bn: 'সেট ১', en: 'Set 1' },
  set2: { bn: 'সেট ২', en: 'Set 2' },
  note: {
    bn: 'প্রতিটি বেগ পাঠ পাশাপাশি দুটি দূরত্ব পাঠের মাঝামাঝি সময়ে বসানো হয়েছে।',
    en: 'Each velocity point sits at the midpoint time between two consecutive distance readings.',
  },
} as const

type LabelKey = keyof typeof L

export default function MotionGrapher({
  config,
  language = 'BN',
}: RendererProps<Config, Params>) {
  const cfg = (config ?? {}) as Config
  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (v: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(v), 'BN') : String(v),
    [language],
  )

  const [datasetKey, setDatasetKey] = useState<'set1' | 'set2'>(
    cfg.dataset ?? 'set1',
  )
  const distanceTime = DATASETS[datasetKey]
  const velocityTime = useMemo(() => deriveVelocity(distanceTime), [distanceTime])
  const accelTime = useMemo(() => deriveAcceleration(distanceTime), [distanceTime])

  const plot = (
    samples: { t: number; value: number }[],
    panelIndex: number,
    stroke = true,
  ) => {
    const maxT = Math.max(...samples.map((s) => s.t))
    const maxV = Math.max(...samples.map((s) => Math.abs(s.value)), 1)
    const x0 = PANEL_X[panelIndex]
    const toX = (v: number) => x0 + (v / maxT) * PANEL_W
    const toY = (v: number) => PANEL_Y + PANEL_H - (v / maxV) * PANEL_H

    const points = samples.map((s) => `${toX(s.t)},${toY(s.value)}`).join(' ')
    return (
      <g key={panelIndex}>
        <line x1={x0} y1={PANEL_Y + PANEL_H} x2={x0 + PANEL_W} y2={PANEL_Y + PANEL_H} className="sim__datum" />
        <line x1={x0} y1={PANEL_Y} x2={x0} y2={PANEL_Y + PANEL_H} className="sim__datum" />
        {stroke && <polyline points={points} className="sim__curve" fill="none" />}
        {samples.map((s, i) => (
          <circle key={i} cx={toX(s.t)} cy={toY(s.value)} r={4} className="sim__dot is-match" />
        ))}
      </g>
    )
  }

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <div className="sim__tabs">
        <button
          type="button"
          className={datasetKey === 'set1' ? 'is-active' : ''}
          onClick={() => setDatasetKey('set1')}
        >
          {t('set1')}
        </button>
        <button
          type="button"
          className={datasetKey === 'set2' ? 'is-active' : ''}
          onClick={() => setDatasetKey('set2')}
        >
          {t('set2')}
        </button>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        {plot(distanceTime, 0)}
        {plot(velocityTime, 1)}
        {plot(accelTime, 2)}

        <text x={PANEL_X[0]} y={PANEL_Y - 10} className="sim__axisLabel">
          {t('distanceTime')}
        </text>
        <text x={PANEL_X[1]} y={PANEL_Y - 10} className="sim__axisLabel">
          {t('velocityTime')}
        </text>
        <text x={PANEL_X[2]} y={PANEL_Y - 10} className="sim__axisLabel">
          {t('accelTime')}
        </text>
      </svg>

      <div className="sim__panel">
        {distanceTime.map((s, i) => (
          <div className="sim__readout" key={i}>
            <span>t = {num(s.t)} s</span>
            <strong>s = {num(s.value)} m</strong>
          </div>
        ))}
      </div>

      <p className="sim__note">{t('note')}</p>
    </figure>
  )
}
