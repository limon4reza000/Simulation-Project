import { useCallback, useMemo, useState } from 'react'
import { electricField, electricPotential } from '../../lib/electricity/electricField'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ELECTRIC_FIELD — তড়িৎ ক্ষেত্র ও বিভব, চিত্র ১০.১১–১০.১৪
 *
 * Digitises §১০.৫-১০.৬ (pp. 283-288) together: a single point charge with an
 * adjustable distance slider, live field (E = kq/r²) and potential
 * (V = kq/r) readouts at that point.
 */

const SOURCE_X = 80
const AXIS_Y = 100
const PX_PER_M = 30

interface Config {
  maxDistanceM?: number
  maxChargeC?: number
}

interface Params {
  q?: number
  distanceM?: number
}

const L = {
  title: { bn: 'তড়িৎ ক্ষেত্র ও বিভব', en: 'Electric Field and Potential' },
  charge: { bn: 'উৎস আধান (q)', en: 'Source charge (q)' },
  distance: { bn: 'দূরত্ব (r)', en: 'Distance (r)' },
  field: { bn: 'তড়িৎ ক্ষেত্র (E = kq/r²)', en: 'Electric field (E = kq/r²)' },
  potential: { bn: 'তড়িৎ বিভব (V = kq/r)', en: 'Electric potential (V = kq/r)' },
  note: {
    bn: 'ক্ষেত্র দূরত্বের বর্গের ব্যস্তানুপাতিক, কিন্তু বিভব দূরত্বের সরাসরি ব্যস্তানুপাতিক — বিভব একটি স্কেলার রাশি।',
    en: 'Field falls off as 1/r², but potential falls off only as 1/r — potential is a scalar.',
  },
} as const

type LabelKey = keyof typeof L

export default function ElectricField({
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

  const maxDistanceM = cfg.maxDistanceM ?? 20
  const maxChargeC = cfg.maxChargeC ?? 10

  const [q, setQ] = useState(params.q ?? 5)
  const [distance, setDistance] = useState(params.distanceM ?? 10)
  const [reported, setReported] = useState(false)

  const field = useMemo(() => electricField(q, distance), [q, distance])
  const potential = useMemo(() => electricPotential(q, distance), [q, distance])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'ELECTRIC_FIELD_EXPLORED',
        metadata: { q, distanceM: distance, fieldNC: field, potentialV: potential },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, q, distance, field, potential, onActivity])

  const pointX = SOURCE_X + Math.min(distance, maxDistanceM) * PX_PER_M

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 700 160" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={40} y1={AXIS_Y} x2={660} y2={AXIS_Y} className="sim__datum" />
        <circle cx={SOURCE_X} cy={AXIS_Y} r={16} className={q >= 0 ? 'sim__dot is-match' : 'sim__force-b'} />
        <circle cx={pointX} cy={AXIS_Y} r={6} className="sim__object" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('charge')} (C)
          <input
            type="range"
            min={-maxChargeC}
            max={maxChargeC}
            step={0.1}
            value={q}
            onChange={(e) => {
              setQ(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('distance')} (m)
          <input
            type="range"
            min={0.5}
            max={maxDistanceM}
            step={0.5}
            value={distance}
            onChange={(e) => {
              setDistance(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('field')} value={`${num(field.toExponential(3))} N/C`} emphasis />
        <Readout label={t('potential')} value={`${num(potential.toExponential(3))} V`} />
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
