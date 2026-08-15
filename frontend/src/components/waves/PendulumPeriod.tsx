import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pendulumPeriod } from '../../lib/waves/pendulumPeriod'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_PENDULUM_PERIOD — সরল স্পন্দন গতি, T = 2π√(l/g)
 *
 * Digitises §৭.১ (pp. 188-189): a pendulum of adjustable length swings at
 * the period the book's own formula predicts, with a heavy/light mass toggle
 * that visibly does nothing to the period — the book's own explicit point
 * (p. 189) that T does not depend on mass at all.
 */

const PIVOT_X = 200
const PIVOT_Y = 20
const PX_PER_M = 150

interface Config {
  maxLengthM?: number
}

interface Params {
  lengthM?: number
}

const L = {
  title: { bn: 'সরল দোলকের পর্যায়কাল', en: "A Simple Pendulum's Period" },
  length: { bn: 'দৈর্ঘ্য (l)', en: 'Length (l)' },
  period: { bn: 'পর্যায়কাল (T = 2π√(l/g))', en: 'Period (T = 2π√(l/g))' },
  heavy: { bn: 'ভারী ভর', en: 'Heavy mass' },
  light: { bn: 'হালকা ভর', en: 'Light mass' },
  note: {
    bn: 'ভর হালকা হোক বা ভারী, পর্যায়কাল একই থাকে — এটি কেবল দৈর্ঘ্যের ওপর নির্ভর করে।',
    en: 'Whether the mass is light or heavy, the period stays the same — it depends only on length.',
  },
} as const

type LabelKey = keyof typeof L

export default function PendulumPeriod({
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

  const maxLengthM = cfg.maxLengthM ?? 3

  const [lengthM, setLengthM] = useState(params.lengthM ?? 1)
  const [heavy, setHeavy] = useState(false)
  const [reported, setReported] = useState(false)

  const period = useMemo(() => pendulumPeriod(lengthM), [lengthM])

  const report = useCallback(
    (nextLength: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'PENDULUM_PERIOD_EXPLORED',
          metadata: { lengthM: nextLength, periodS: period },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, period, onActivity],
  )

  const startRef = useRef(0)
  const frameRef = useRef<number | undefined>(undefined)
  const [angleDeg, setAngleDeg] = useState(30)

  useEffect(() => {
    startRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000
      const deg = 30 * Math.cos((elapsed / period) * 2 * Math.PI)
      setAngleDeg(deg)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [period])

  const angleRad = (angleDeg * Math.PI) / 180
  const stringLenPx = lengthM * PX_PER_M
  const bobX = PIVOT_X + stringLenPx * Math.sin(angleRad)
  const bobY = PIVOT_Y + stringLenPx * Math.cos(angleRad)
  const bobRadius = heavy ? 18 : 10

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 400 340" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={PIVOT_X - 30} y1={PIVOT_Y} x2={PIVOT_X + 30} y2={PIVOT_Y} className="sim__datum" />
        <line x1={PIVOT_X} y1={PIVOT_Y} x2={bobX} y2={bobY} className="sim__beam" strokeWidth={2} />
        <circle cx={bobX} cy={bobY} r={bobRadius} className="sim__object" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('length')} (m)
          <input
            type="range"
            min={0.1}
            max={maxLengthM}
            step={0.05}
            value={lengthM}
            onChange={(e) => {
              const v = Number(e.target.value)
              setLengthM(v)
              report(v)
            }}
          />
        </label>
        <div className="sim__practice">
          <button type="button" onClick={() => setHeavy(false)} disabled={!heavy}>
            {t('light')}
          </button>
          <button type="button" className="is-secondary" onClick={() => setHeavy(true)} disabled={heavy}>
            {t('heavy')}
          </button>
        </div>
      </div>

      <div className="sim__panel">
        <Readout label={t('period')} value={`${num(period.toFixed(2))} s`} emphasis />
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
