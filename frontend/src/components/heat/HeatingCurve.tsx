import { useCallback, useMemo, useState } from 'react'
import { heatingCurveBoundaries, stateAtHeat, WATER } from '../../lib/heat/heatingCurve'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_HEATING_CURVE — গলন ও বাষ্পীভবন, চিত্র ৬.০৮
 *
 * Digitises §৬.৪ (pp. 175-177): a heat-added slider drives a substance from
 * solid through melting (flat at the melting point), liquid, boiling (flat
 * at the boiling point) and gas — reproducing চিত্র ৬.০৮'s own five-segment
 * shape directly, with the current phase and temperature both shown live.
 */

const VIEW_W = 700
const VIEW_H = 260
const PAD = 40
const START_TEMP_C = -20
const END_TEMP_C = 120

interface Config {
  massKg?: number
}

type Params = Record<string, never>

const L = {
  title: { bn: 'গলন ও বাষ্পীভবন', en: 'Melting and Boiling' },
  heatAdded: { bn: 'যোগকৃত তাপ', en: 'Heat added' },
  temp: { bn: 'তাপমাত্রা', en: 'Temperature' },
  phase: { bn: 'অবস্থা', en: 'Phase' },
  solid: { bn: 'কঠিন', en: 'Solid' },
  melting: { bn: 'গলছে (তাপমাত্রা স্থির)', en: 'Melting (temperature flat)' },
  liquid: { bn: 'তরল', en: 'Liquid' },
  boiling: { bn: 'ফুটছে (তাপমাত্রা স্থির)', en: 'Boiling (temperature flat)' },
  gas: { bn: 'গ্যাস', en: 'Gas' },
  note: {
    bn: 'গলন ও ফুটন চলাকালীন তাপ দেওয়া সত্ত্বেও তাপমাত্রা বাড়ে না — সেই তাপ আণবিক বন্ধন ভাঙতে ব্যয় হয়, একেই সুপ্ততাপ বলে।',
    en: 'Through melting and boiling, added heat does not raise the temperature — it goes into breaking molecular bonds instead; this is the latent heat.',
  },
} as const

type LabelKey = keyof typeof L
type PhaseKey = 'solid' | 'melting' | 'liquid' | 'boiling' | 'gas'

export default function HeatingCurve({
  config,
  language = 'BN',
  onActivity,
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

  const massKg = cfg.massKg ?? 1

  const boundaries = useMemo(
    () => heatingCurveBoundaries(WATER, massKg, START_TEMP_C, END_TEMP_C),
    [massKg],
  )
  const totalHeat = boundaries[boundaries.length - 1].heatJ

  const [heat, setHeat] = useState(0)
  const [reportedPhases, setReportedPhases] = useState<Set<PhaseKey>>(new Set())

  const state = useMemo(
    () => stateAtHeat(WATER, massKg, START_TEMP_C, END_TEMP_C, heat),
    [massKg, heat],
  )

  const onSlide = useCallback(
    (nextHeat: number) => {
      setHeat(nextHeat)
      const phase = stateAtHeat(WATER, massKg, START_TEMP_C, END_TEMP_C, nextHeat).phase as PhaseKey
      if ((phase === 'melting' || phase === 'boiling') && !reportedPhases.has(phase)) {
        setReportedPhases((prev) => new Set(prev).add(phase))
        onActivity?.({
          activityType: 'HEATING_CURVE_PLATEAU_REACHED',
          metadata: { phase, heatJ: nextHeat },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [massKg, reportedPhases, onActivity],
  )

  const points = boundaries
    .map((b) => {
      const x = PAD + (b.heatJ / totalHeat) * (VIEW_W - 2 * PAD)
      const y =
        VIEW_H -
        PAD -
        ((b.temperatureC - START_TEMP_C) / (END_TEMP_C - START_TEMP_C)) * (VIEW_H - 2 * PAD)
      return `${x},${y}`
    })
    .join(' ')

  const markerX = PAD + (heat / totalHeat) * (VIEW_W - 2 * PAD)
  const markerY =
    VIEW_H -
    PAD -
    ((state.temperatureC - START_TEMP_C) / (END_TEMP_C - START_TEMP_C)) * (VIEW_H - 2 * PAD)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <line x1={PAD} y1={VIEW_H - PAD} x2={VIEW_W - PAD} y2={VIEW_H - PAD} className="sim__datum" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={VIEW_H - PAD} className="sim__datum" />
        <polyline points={points} className="sim__curve" fill="none" />
        <circle cx={markerX} cy={markerY} r={5} className="sim__dot is-match" />
      </svg>

      <label className="sim__control">
        {t('heatAdded')}
        <input
          type="range"
          min={0}
          max={totalHeat}
          step={totalHeat / 500}
          value={heat}
          onChange={(e) => onSlide(Number(e.target.value))}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('temp')} value={`${num(state.temperatureC.toFixed(1))} °C`} emphasis />
        <Readout label={t('phase')} value={t(state.phase as PhaseKey)} />
        <Readout label={t('heatAdded')} value={`${num((heat / 1000).toFixed(1))} kJ`} />
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
