import { useCallback, useMemo, useState } from 'react'
import { relativeFieldStrength } from '../../lib/magnetism/electromagnetStrength'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ELECTROMAGNET_STRENGTH — তাড়িতচুম্বক, চিত্র ১২.০৭
 *
 * Digitises §১২.২.২ (pp. 334-335): a coil with adjustable current and
 * number of turns, with a relative field-strength readout modelling the
 * book's own stated dual proportionality (strength ∝ current, ∝ turns).
 */

interface Config {
  maxCurrentA?: number
  maxTurns?: number
}

interface Params {
  currentA?: number
  turns?: number
}

const L = {
  title: { bn: 'তাড়িতচুম্বকের শক্তি', en: "An Electromagnet's Strength" },
  current: { bn: 'বিদ্যুৎপ্রবাহ (I)', en: 'Current (I)' },
  turns: { bn: 'প্যাঁচসংখ্যা (N)', en: 'Number of turns (N)' },
  strength: { bn: 'আপেক্ষিক চৌম্বক শক্তি', en: 'Relative magnetic strength' },
  note: {
    bn: 'বিদ্যুৎপ্রবাহ বা প্যাঁচসংখ্যা দ্বিগুণ করলে চৌম্বক শক্তিও দ্বিগুণ হয় — এই আপেক্ষিক মান বইয়ের কোনো নির্দিষ্ট সংখ্যাসূত্র থেকে নয়, বরং এর নিজস্ব বর্ণিত সমানুপাতিক সম্পর্ক থেকে।',
    en: "Doubling either current or turns doubles the strength — this relative value comes from the book's own stated proportionality, not a printed numeric formula.",
  },
} as const

type LabelKey = keyof typeof L

export default function ElectromagnetStrength({
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

  const maxCurrentA = cfg.maxCurrentA ?? 5
  const maxTurns = cfg.maxTurns ?? 300

  const [current, setCurrent] = useState(params.currentA ?? 1)
  const [turns, setTurns] = useState(params.turns ?? 50)
  const [reported, setReported] = useState(false)

  const strength = useMemo(() => relativeFieldStrength(current, turns), [current, turns])
  const maxStrength = maxCurrentA * maxTurns

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'ELECTROMAGNET_STRENGTH_EXPLORED',
        metadata: { currentA: current, turns, relativeStrength: strength },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, current, turns, strength, onActivity])

  const coilCount = Math.min(12, Math.max(2, Math.round(turns / 25)))
  const fieldOpacity = Math.min(1, strength / (maxStrength * 0.3))

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 300 140" className="sim__svg" role="img" aria-label={t('strength')}>
        <rect x={100} y={40} width={100} height={60} className="sim__object is-weak" />
        {Array.from({ length: coilCount }).map((_, i) => (
          <ellipse
            key={i}
            cx={100 + (i * 100) / (coilCount - 1 || 1)}
            cy={70}
            rx={10}
            ry={35}
            className="sim__dot is-match"
            fill="none"
            strokeWidth={2}
            opacity={0.6}
          />
        ))}
        <circle cx={150} cy={70} r={60} className="sim__marker" fill="none" strokeWidth={3} opacity={fieldOpacity} />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('current')} (A)
          <input
            type="range"
            min={0}
            max={maxCurrentA}
            step={0.1}
            value={current}
            onChange={(e) => {
              setCurrent(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('turns')}
          <input
            type="range"
            min={1}
            max={maxTurns}
            step={1}
            value={turns}
            onChange={(e) => {
              setTurns(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('strength')} value={num(strength.toFixed(1))} emphasis />
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
