import { useCallback, useMemo, useState } from 'react'
import { fromCelsius } from '../../lib/heat/temperatureScales'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_TEMPERATURE_SCALES — ভিন্ন স্কেলের মাঝে সম্পর্ক, চিত্র ৬.০২
 *
 * Digitises §৬.২.১ (pp. 165-167): one temperature slider, three simultaneous
 * readouts (Celsius, Kelvin, Fahrenheit), with quick-jump buttons to the
 * book's own three landmark temperatures: where Celsius and Fahrenheit
 * agree (-40), where Kelvin and Fahrenheit agree (301.44°C = 574.59), and
 * body temperature (36.89°C = 98.4°F).
 */

const TUBE_TOP = 20
const TUBE_BOTTOM = 240
const MIN_C = -273.15
const MAX_C = 600

interface Config {
  minC?: number
  maxC?: number
}

interface Params {
  celsius?: number
}

const L = {
  title: { bn: 'তাপমাত্রার স্কেল', en: 'Temperature Scales' },
  celsius: { bn: 'সেলসিয়াস (°C)', en: 'Celsius (°C)' },
  kelvin: { bn: 'কেলভিন (K)', en: 'Kelvin (K)' },
  fahrenheit: { bn: 'ফারেনহাইট (°F)', en: 'Fahrenheit (°F)' },
  agreeCF: { bn: 'C = F বিন্দু', en: 'C = F point' },
  agreeKF: { bn: 'K = F বিন্দু', en: 'K = F point' },
  bodyTemp: { bn: 'দেহের তাপমাত্রা', en: 'Body temperature' },
  note: {
    bn: 'সেলসিয়াস ও কেলভিন স্কেল কখনোই সমান হয় না — এরা একটি স্থির যোজক ধ্রুবক দ্বারা পৃথক।',
    en: 'Celsius and Kelvin never agree — they differ by a fixed additive constant.',
  },
} as const

type LabelKey = keyof typeof L

export default function TemperatureScales({
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

  const minC = cfg.minC ?? MIN_C
  const maxC = cfg.maxC ?? MAX_C

  const [celsius, setCelsius] = useState(params.celsius ?? 25)
  const [reported, setReported] = useState(false)

  const temp = useMemo(() => fromCelsius(celsius), [celsius])

  const report = useCallback(
    (c: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'TEMPERATURE_SCALES_EXPLORED',
          metadata: { celsius: c },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const fraction = (celsius - minC) / (maxC - minC)
  const fillY = TUBE_BOTTOM - fraction * (TUBE_BOTTOM - TUBE_TOP)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 200 260" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={100} y1={TUBE_TOP} x2={100} y2={TUBE_BOTTOM} className="sim__datum" strokeWidth={10} />
        <line x1={100} y1={fillY} x2={100} y2={TUBE_BOTTOM} className="sim__dot is-match" strokeWidth={10} />
        <circle cx={100} cy={TUBE_BOTTOM + 12} r={14} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('celsius')}
          <input
            type="range"
            min={minC}
            max={maxC}
            step={0.5}
            value={celsius}
            onChange={(e) => {
              const v = Number(e.target.value)
              setCelsius(v)
              report(v)
            }}
          />
        </label>
        <div className="sim__practice">
          <button type="button" onClick={() => setCelsius(-40)}>
            {t('agreeCF')}
          </button>
          <button type="button" onClick={() => setCelsius(301.44)}>
            {t('agreeKF')}
          </button>
          <button type="button" className="is-secondary" onClick={() => setCelsius(36.89)}>
            {t('bodyTemp')}
          </button>
        </div>
      </div>

      <div className="sim__panel">
        <Readout label={t('celsius')} value={`${num(temp.celsius.toFixed(2))} °C`} emphasis />
        <Readout label={t('kelvin')} value={`${num(temp.kelvin.toFixed(2))} K`} />
        <Readout label={t('fahrenheit')} value={`${num(temp.fahrenheit.toFixed(2))} °F`} />
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
