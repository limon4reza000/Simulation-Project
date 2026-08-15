import { useCallback, useMemo, useState } from 'react'
import { pressure, weightFromMass } from '../../lib/pressure/pressure'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_PRESSURE — চাপ, চিত্র ৫.০১
 *
 * Digitises §৫.১ (pp. 129-130): the same weight spread over an adjustable
 * contact area, live P = F/A readout. The book's own point (p. 130) is the
 * quicksand-safety framing: lying down spreads your weight over a larger
 * area and gives a much smaller pressure than standing does.
 */

interface Config {
  maxMassKg?: number
  minAreaM2?: number
  maxAreaM2?: number
}

interface Params {
  massKg?: number
  areaM2?: number
}

const L = {
  title: { bn: 'চাপ', en: 'Pressure' },
  mass: { bn: 'ভর (m)', en: 'Mass (m)' },
  area: { bn: 'সংস্পর্শ ক্ষেত্রফল (A)', en: 'Contact area (A)' },
  weight: { bn: 'ওজন (F)', en: 'Weight (F)' },
  pressureLabel: { bn: 'চাপ (P = F/A)', en: 'Pressure (P = F/A)' },
  lying: { bn: 'শুয়ে', en: 'Lying' },
  standing: { bn: 'দাঁড়িয়ে', en: 'Standing' },
  note: {
    bn: 'একই ওজন বড় ক্ষেত্রফলে ছড়িয়ে দিলে চাপ কমে যায় — সে কারণেই চোরাবালিতে শুয়ে পড়া নিরাপদ।',
    en: 'The same weight spread over a larger area gives less pressure — why lying flat is safer in quicksand.',
  },
} as const

type LabelKey = keyof typeof L

export default function Pressure({
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

  const maxMassKg = cfg.maxMassKg ?? 100
  const minAreaM2 = cfg.minAreaM2 ?? 0.01
  const maxAreaM2 = cfg.maxAreaM2 ?? 0.6

  const [mass, setMass] = useState(params.massKg ?? 50)
  const [area, setArea] = useState(params.areaM2 ?? 0.03)
  const [reported, setReported] = useState(false)

  const weight = useMemo(() => weightFromMass(mass), [mass])
  const P = useMemo(() => pressure(weight, area), [weight, area])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'PRESSURE_COMPUTED',
        metadata: { massKg: mass, areaM2: area, pressurePa: P },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, mass, area, P, onActivity])

  const barHeight = Math.min(200, (area / maxAreaM2) * 200)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 300 260" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={20} y1={230} x2={280} y2={230} className="sim__datum" />
        <rect x={150 - barHeight / 2} y={230 - barHeight} width={barHeight} height={barHeight} className="sim__object" rx={4} />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={1}
            max={maxMassKg}
            step={1}
            value={mass}
            onChange={(e) => {
              setMass(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('area')} (m²)
          <input
            type="range"
            min={minAreaM2}
            max={maxAreaM2}
            step={0.01}
            value={area}
            onChange={(e) => {
              setArea(Number(e.target.value))
              report()
            }}
          />
        </label>
        <div className="sim__practice">
          <button type="button" onClick={() => setArea(0.03)}>
            {t('standing')}
          </button>
          <button type="button" className="is-secondary" onClick={() => setArea(0.5)}>
            {t('lying')}
          </button>
        </div>
      </div>

      <div className="sim__panel">
        <Readout label={t('weight')} value={`${num(weight.toFixed(0))} N`} />
        <Readout label={t('pressureLabel')} value={`${num(P.toFixed(0))} N/m²`} emphasis />
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
