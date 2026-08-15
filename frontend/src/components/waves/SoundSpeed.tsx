import { useCallback, useMemo, useState } from 'react'
import { speedAtTemperature, SOUND_SPEED_TABLE } from '../../lib/waves/soundSpeed'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_SOUND_SPEED — শব্দের বেগের পার্থক্য, v ∝ √T, টেবিল ৭.০১
 *
 * Digitises §৭.৩.২ (pp. 202-203): a temperature slider scales a reference
 * speed via v1 = v2*sqrt(T1/T2), and a medium selector reproduces টেবিল
 * ৭.০১'s six printed speeds side by side as a bar comparison.
 */

const BAR_MAX_MS = 12000

interface Config {
  minTempC?: number
  maxTempC?: number
}

interface Params {
  tempC?: number
  mediumKey?: (typeof SOUND_SPEED_TABLE)[number]['key']
}

type MediumKey = (typeof SOUND_SPEED_TABLE)[number]['key']

const L = {
  title: { bn: 'শব্দের বেগের পার্থক্য', en: 'Variation of Sound Speed' },
  temp: { bn: 'তাপমাত্রা (T)', en: 'Temperature (T)' },
  speedAtTemp: { bn: 'এই তাপমাত্রায় বেগ', en: 'Speed at this temperature' },
  medium: { bn: 'মাধ্যম', en: 'Medium' },
  note: {
    bn: 'বেগ পরম (কেলভিন) তাপমাত্রার বর্গমূলের সমানুপাতিক — সেলসিয়াস নয়।',
    en: 'Speed is proportional to the square root of the absolute (Kelvin) temperature — not Celsius.',
  },
} as const

type LabelKey = keyof typeof L

const REFERENCE_SPEED_MS = 338
const REFERENCE_TEMP_C = 10

export default function SoundSpeed({
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

  const minTempC = cfg.minTempC ?? -20
  const maxTempC = cfg.maxTempC ?? 50

  const [tempC, setTempC] = useState(params.tempC ?? 30)
  const [mediumKey, setMediumKey] = useState<MediumKey>(params.mediumKey ?? 'air')
  const [reported, setReported] = useState(false)

  const speed = useMemo(
    () => speedAtTemperature(REFERENCE_SPEED_MS, REFERENCE_TEMP_C, tempC),
    [tempC],
  )

  const report = useCallback(
    (nextTemp: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'SOUND_SPEED_EXPLORED',
          metadata: { tempC: nextTemp, speedMs: speed },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, speed, onActivity],
  )

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <label className="sim__control">
        {t('temp')} (°C)
        <input
          type="range"
          min={minTempC}
          max={maxTempC}
          step={1}
          value={tempC}
          onChange={(e) => {
            const v = Number(e.target.value)
            setTempC(v)
            report(v)
          }}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('speedAtTemp')} value={`${num(speed.toFixed(1))} m/s`} emphasis />
      </div>

      <svg viewBox="0 0 900 260" className="sim__svg" role="img" aria-label={t('medium')}>
        {SOUND_SPEED_TABLE.map((m, i) => {
          const y = 10 + i * 40
          const w = (m.speedMs / BAR_MAX_MS) * 800
          return (
            <g key={m.key}>
              <rect
                x={80}
                y={y}
                width={w}
                height={26}
                className={m.key === mediumKey ? 'sim__dot is-match' : 'sim__object'}
                onClick={() => setMediumKey(m.key)}
              />
              <text x={4} y={y + 18} className="sim__tickLabel">
                {language === 'BN' ? m.labelBn : m.labelEn}
              </text>
              <text x={86 + w} y={y + 18} className="sim__tickLabel">
                {num(m.speedMs)} m/s
              </text>
            </g>
          )
        })}
      </svg>

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
