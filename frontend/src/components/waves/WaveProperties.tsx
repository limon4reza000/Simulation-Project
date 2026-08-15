import { useCallback, useMemo, useState } from 'react'
import { describeWave } from '../../lib/waves/waveProperties'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_WAVE_PROPERTIES — তরঙ্গ-সংশ্লিষ্ট রাশি, চিত্র ৭.০৬–৭.০৯
 *
 * Digitises §৭.২.৩ (pp. 195-198): two side-by-side wave snapshots, exactly
 * as the book presents them — displacement vs. position (yields amplitude
 * and wavelength) and displacement vs. time (yields amplitude and period) —
 * with live frequency and speed readouts computed only once both are known.
 */

const VIEW_W = 420
const VIEW_H = 160
const MID_Y = 80

interface Config {
  maxAmplitudeM?: number
  maxWavelengthM?: number
  maxPeriodS?: number
}

interface Params {
  amplitudeM?: number
  wavelengthM?: number
  periodS?: number
}

const L = {
  title: { bn: 'তরঙ্গ-সংশ্লিষ্ট রাশি', en: 'Wave-related Quantities' },
  positionGraph: { bn: 'সরণ বনাম অবস্থান', en: 'Displacement vs. position' },
  timeGraph: { bn: 'সরণ বনাম সময়', en: 'Displacement vs. time' },
  amplitude: { bn: 'বিস্তার (a)', en: 'Amplitude (a)' },
  wavelength: { bn: 'তরঙ্গদৈর্ঘ্য (λ)', en: 'Wavelength (λ)' },
  period: { bn: 'পর্যায়কাল (T)', en: 'Period (T)' },
  frequency: { bn: 'কম্পাঙ্ক (f = 1/T)', en: 'Frequency (f = 1/T)' },
  speed: { bn: 'বেগ (v = fλ)', en: 'Speed (v = fλ)' },
  note: {
    bn: 'শুধু অবস্থান-লেখচিত্র থেকে বিস্তার ও তরঙ্গদৈর্ঘ্য জানা যায়; শুধু সময়-লেখচিত্র থেকে বিস্তার ও পর্যায়কাল — দুটো মিলিয়েই কম্পাঙ্ক ও বেগ বের করা সম্ভব।',
    en: 'The position graph alone gives amplitude and wavelength; the time graph alone gives amplitude and period — only together can frequency and speed be found.',
  },
} as const

type LabelKey = keyof typeof L

export default function WaveProperties({
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

  const maxAmplitudeM = cfg.maxAmplitudeM ?? 0.3
  const maxWavelengthM = cfg.maxWavelengthM ?? 3
  const maxPeriodS = cfg.maxPeriodS ?? 1

  const [amplitude, setAmplitude] = useState(params.amplitudeM ?? 0.1)
  const [wavelength, setWavelength] = useState(params.wavelengthM ?? 1)
  const [period, setPeriod] = useState(params.periodS ?? 0.2)
  const [reported, setReported] = useState(false)

  const wave = useMemo(
    () => describeWave({ amplitudeM: amplitude, wavelengthM: wavelength, periodS: period }),
    [amplitude, wavelength, period],
  )

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'WAVE_PROPERTIES_EXPLORED',
        metadata: {
          amplitudeM: amplitude,
          wavelengthM: wavelength,
          periodS: period,
          frequencyHz: wave.frequencyHz,
          speedMs: wave.speedMs,
        },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, amplitude, wavelength, period, wave, onActivity])

  const sineWave = useCallback(
    (spanUnits: number, ampM: number) => {
      const pxPerUnit = VIEW_W / spanUnits
      const ampPx = (ampM / maxAmplitudeM) * 60
      const points: string[] = []
      for (let i = 0; i <= 200; i++) {
        const x = (i / 200) * VIEW_W
        const u = x / pxPerUnit
        const y = MID_Y - ampPx * Math.sin((2 * Math.PI * u) / spanUnits)
        points.push(`${x},${y}`)
      }
      return points.join(' ')
    },
    [maxAmplitudeM],
  )

  const positionPoints = useMemo(
    () => sineWave(wavelength * 3, amplitude),
    [sineWave, wavelength, amplitude],
  )
  const timePoints = useMemo(() => sineWave(period * 3, amplitude), [sineWave, period, amplitude])

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <p className="sim__axisLabel">{t('positionGraph')}</p>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('positionGraph')}
      >
        <line x1={0} y1={MID_Y} x2={VIEW_W} y2={MID_Y} className="sim__datum" />
        <polyline points={positionPoints} className="sim__curve" fill="none" />
      </svg>

      <p className="sim__axisLabel">{t('timeGraph')}</p>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('timeGraph')}
      >
        <line x1={0} y1={MID_Y} x2={VIEW_W} y2={MID_Y} className="sim__datum" />
        <polyline points={timePoints} className="sim__curve" fill="none" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('amplitude')} (m)
          <input
            type="range"
            min={0.01}
            max={maxAmplitudeM}
            step={0.01}
            value={amplitude}
            onChange={(e) => {
              setAmplitude(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('wavelength')} (m)
          <input
            type="range"
            min={0.1}
            max={maxWavelengthM}
            step={0.1}
            value={wavelength}
            onChange={(e) => {
              setWavelength(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('period')} (s)
          <input
            type="range"
            min={0.05}
            max={maxPeriodS}
            step={0.05}
            value={period}
            onChange={(e) => {
              setPeriod(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('frequency')} value={`${num(wave.frequencyHz.toFixed(2))} Hz`} />
        <Readout label={t('speed')} value={`${num(wave.speedMs.toFixed(2))} m/s`} emphasis />
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
