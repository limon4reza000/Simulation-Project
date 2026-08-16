import { useCallback, useMemo, useState } from 'react'
import { coulombForce } from '../../lib/electricity/coulombsLaw'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_COULOMBS_LAW — তড়িৎ বল, চিত্র ১০.০৯–১০.১০
 *
 * Digitises §১০.৮ (pp. 279-282): two point charges at an adjustable
 * separation, live signed force from F = kq1q2/r2 — positive (repulsion)
 * for like charges, negative (attraction) for unlike, exactly as the book's
 * own sign convention works.
 */

const AXIS_Y = 100
const CENTER_X = 220

interface Config {
  maxSeparationM?: number
  maxChargeC?: number
}

interface Params {
  q1?: number
  q2?: number
  separationM?: number
}

const L = {
  title: { bn: 'তড়িৎ বল (কুলম্বের সূত্র)', en: "Electric Force (Coulomb's Law)" },
  q1: { bn: 'আধান q১ (C)', en: 'Charge q1 (C)' },
  q2: { bn: 'আধান q২ (C)', en: 'Charge q2 (C)' },
  separation: { bn: 'দূরত্ব (r)', en: 'Separation (r)' },
  force: { bn: 'বল (F = kq₁q₂/r²)', en: 'Force (F = kq1q2/r2)' },
  attraction: { bn: 'আকর্ষণ', en: 'Attraction' },
  repulsion: { bn: 'বিকর্ষণ', en: 'Repulsion' },
  note: {
    bn: 'সমধর্মী আধান বিকর্ষণ করে (F ধনাত্মক), বিপরীতধর্মী আধান আকর্ষণ করে (F ঋণাত্মক)।',
    en: 'Like charges repel (F positive); unlike charges attract (F negative).',
  },
} as const

type LabelKey = keyof typeof L

export default function CoulombsLaw({
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

  const maxSeparationM = cfg.maxSeparationM ?? 2
  const maxChargeC = cfg.maxChargeC ?? 5

  const [q1, setQ1] = useState(params.q1 ?? 1)
  const [q2, setQ2] = useState(params.q2 ?? -1)
  const [separation, setSeparation] = useState(params.separationM ?? 0.5)
  const [reported, setReported] = useState(false)

  const force = useMemo(() => coulombForce(q1, q2, separation), [q1, q2, separation])
  const attraction = force < 0

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'COULOMBS_LAW_EXPLORED',
        metadata: { q1, q2, separationM: separation, forceN: force },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, q1, q2, separation, force, onActivity])

  const halfGap = Math.max(20, (separation / maxSeparationM) * 180)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 440 160" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={40} y1={AXIS_Y} x2={400} y2={AXIS_Y} className="sim__datum" />
        <circle
          cx={CENTER_X - halfGap}
          cy={AXIS_Y}
          r={16}
          className={q1 >= 0 ? 'sim__dot is-match' : 'sim__force-b'}
        />
        <circle
          cx={CENTER_X + halfGap}
          cy={AXIS_Y}
          r={16}
          className={q2 >= 0 ? 'sim__dot is-match' : 'sim__force-b'}
        />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('q1')}
          <input
            type="range"
            min={-maxChargeC}
            max={maxChargeC}
            step={0.1}
            value={q1}
            onChange={(e) => {
              setQ1(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('q2')}
          <input
            type="range"
            min={-maxChargeC}
            max={maxChargeC}
            step={0.1}
            value={q2}
            onChange={(e) => {
              setQ2(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('separation')} (m)
          <input
            type="range"
            min={0.05}
            max={maxSeparationM}
            step={0.05}
            value={separation}
            onChange={(e) => {
              setSeparation(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('force')} value={`${num(force.toExponential(3))} N`} emphasis />
        <Readout label="" value={attraction ? t('attraction') : t('repulsion')} />
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
