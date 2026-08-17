import { useCallback, useMemo, useState } from 'react'
import { remainingFraction, halfLivesElapsed } from '../../lib/nuclear/halfLife'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_HALF_LIFE — অর্ধায়ু, §১৩.১.৪
 *
 * Digitises N = N0(1/2)^(t/T) directly (p. 352): an adjustable half-life and
 * elapsed time, live remaining-fraction readout and a decay-curve plot.
 */

const GRAPH_X = 40
const GRAPH_Y = 20
const GRAPH_W = 320
const GRAPH_H = 140

interface Config {
  maxHalfLifeYears?: number
  maxTimeYears?: number
}

interface Params {
  halfLifeYears?: number
  elapsedYears?: number
}

const L = {
  title: { bn: 'অর্ধায়ু', en: 'Half-Life' },
  halfLife: { bn: 'অর্ধায়ু (T)', en: 'Half-life (T)' },
  elapsed: { bn: 'অতিবাহিত সময় (t)', en: 'Elapsed time (t)' },
  remaining: { bn: 'অবশিষ্ট ভগ্নাংশ', en: 'Remaining fraction' },
  halfLivesLabel: { bn: 'অতিক্রান্ত অর্ধায়ু সংখ্যা', en: 'Half-lives elapsed' },
  note: {
    bn: 'দুটি অর্ধায়ু পার হলে মাত্র ১/৪ অংশ তেজস্ক্রিয় নিউক্লিয়াস অবশিষ্ট থাকে — কিন্তু নমুনার মোট ভর প্রায় অপরিবর্তিতই থাকে।',
    en: 'After two half-lives, only 1/4 of the original radioactive nuclei remain — but the sample\'s total mass barely changes.',
  },
} as const

type LabelKey = keyof typeof L

export default function HalfLife({
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

  const maxHalfLifeYears = cfg.maxHalfLifeYears ?? 500
  const maxTimeYears = cfg.maxTimeYears ?? 1000

  const [halfLife, setHalfLife] = useState(params.halfLifeYears ?? 100)
  const [elapsed, setElapsed] = useState(params.elapsedYears ?? 200)
  const [reported, setReported] = useState(false)

  const fraction = useMemo(() => remainingFraction(elapsed, halfLife), [elapsed, halfLife])
  const livesElapsed = useMemo(() => halfLivesElapsed(elapsed, halfLife), [elapsed, halfLife])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'HALF_LIFE_EXPLORED',
        metadata: { halfLifeYears: halfLife, elapsedYears: elapsed, remainingFraction: fraction },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, halfLife, elapsed, fraction, onActivity])

  const curvePoints = Array.from({ length: 41 }, (_, i) => {
    const time = (i / 40) * maxTimeYears
    const x = GRAPH_X + (time / maxTimeYears) * GRAPH_W
    const y = GRAPH_Y + GRAPH_H - remainingFraction(time, halfLife) * GRAPH_H
    return `${x},${y}`
  }).join(' ')

  const dotX = GRAPH_X + (Math.min(elapsed, maxTimeYears) / maxTimeYears) * GRAPH_W
  const dotY = GRAPH_Y + GRAPH_H - fraction * GRAPH_H

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 400 180" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={GRAPH_X} y1={GRAPH_Y + GRAPH_H} x2={GRAPH_X + GRAPH_W} y2={GRAPH_Y + GRAPH_H} className="sim__datum" />
        <line x1={GRAPH_X} y1={GRAPH_Y} x2={GRAPH_X} y2={GRAPH_Y + GRAPH_H} className="sim__datum" />
        <polyline points={curvePoints} className="sim__curve" fill="none" />
        <circle cx={dotX} cy={dotY} r={5} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('halfLife')} (years)
          <input
            type="range"
            min={1}
            max={maxHalfLifeYears}
            step={1}
            value={halfLife}
            onChange={(e) => {
              setHalfLife(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('elapsed')} (years)
          <input
            type="range"
            min={0}
            max={maxTimeYears}
            step={1}
            value={elapsed}
            onChange={(e) => {
              setElapsed(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('remaining')} value={`${num((fraction * 100).toFixed(1))}%`} emphasis />
        <Readout label={t('halfLivesLabel')} value={num(livesElapsed.toFixed(2))} />
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
