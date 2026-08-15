import { useCallback, useMemo, useState } from 'react'
import { finalTemperature } from '../../lib/heat/calorimetry'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_CALORIMETRY — ক্যালোরিমিতির মূলনীতি, §৬.৫–৬.৬
 *
 * Digitises §৬.৫-৬.৬ (pp. 178-181): two bodies at different temperatures
 * come into contact and settle at one common final temperature, with heat
 * lost by the hotter exactly equal to heat gained by the cooler. Presets
 * jump to the book's own worked examples: mixing two masses of water, and
 * dropping a small hot mass of iron into a much larger mass of water.
 */

interface Config {
  maxMassKg?: number
  maxTempC?: number
}

interface Params {
  massAKg?: number
  specificHeatA?: number
  tempAC?: number
  massBKg?: number
  specificHeatB?: number
  tempBC?: number
}

const L = {
  title: { bn: 'ক্যালোরিমিতির মূলনীতি', en: 'Principle of Calorimetry' },
  bodyA: { bn: 'বস্তু ক', en: 'Body A' },
  bodyB: { bn: 'বস্তু খ', en: 'Body B' },
  mass: { bn: 'ভর', en: 'Mass' },
  specificHeat: { bn: 'আপেক্ষিক তাপ', en: 'Specific heat' },
  temp: { bn: 'তাপমাত্রা', en: 'Temperature' },
  finalTemp: { bn: 'চূড়ান্ত তাপমাত্রা', en: 'Final temperature' },
  waterWaterPreset: { bn: 'পানি + পানি (p. 181)', en: 'Water + water (p. 181)' },
  ironWaterPreset: { bn: 'লোহা + পানি (p. 181)', en: 'Iron + water (p. 181)' },
  note: {
    bn: 'উত্তপ্ত বস্তু যতটুকু তাপ হারায়, শীতল বস্তু ঠিক ততটুকুই তাপ গ্রহণ করে — কোনো তাপ নষ্ট হয় না বলে ধরে নেওয়া হয়।',
    en: 'The hotter body loses exactly the heat the cooler body gains — no heat is assumed lost to the surroundings.',
  },
} as const

type LabelKey = keyof typeof L

export default function CalorimetryLab({
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

  const maxMassKg = cfg.maxMassKg ?? 5
  const maxTempC = cfg.maxTempC ?? 150

  const [massA, setMassA] = useState(params.massAKg ?? 2)
  const [specificHeatA, setSpecificHeatA] = useState(params.specificHeatA ?? 4200)
  const [tempA, setTempA] = useState(params.tempAC ?? 75)
  const [massB, setMassB] = useState(params.massBKg ?? 1)
  const [specificHeatB, setSpecificHeatB] = useState(params.specificHeatB ?? 4200)
  const [tempB, setTempB] = useState(params.tempBC ?? 20)
  const [reported, setReported] = useState(false)

  const final = useMemo(
    () =>
      finalTemperature(
        { massKg: massA, specificHeatJKgK: specificHeatA, tempC: tempA },
        { massKg: massB, specificHeatJKgK: specificHeatB, tempC: tempB },
      ),
    [massA, specificHeatA, tempA, massB, specificHeatB, tempB],
  )

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'CALORIMETRY_MIXED',
        metadata: { massA, tempA, massB, tempB, finalTempC: final },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, massA, tempA, massB, tempB, final, onActivity])

  const applyWaterWaterPreset = useCallback(() => {
    setMassA(2)
    setSpecificHeatA(4200)
    setTempA(75)
    setMassB(1)
    setSpecificHeatB(4200)
    setTempB(20)
    setReported(false)
  }, [])

  const applyIronWaterPreset = useCallback(() => {
    setMassA(0.01)
    setSpecificHeatA(450)
    setTempA(120)
    setMassB(1)
    setSpecificHeatB(4200)
    setTempB(30)
    setReported(false)
  }, [])

  const totalTempRange = maxTempC || 1
  const barA = 40 + (tempA / totalTempRange) * 700
  const barB = 40 + (tempB / totalTempRange) * 700
  const barFinal = 40 + (final / totalTempRange) * 700

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 800 140" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={40} y1={30} x2={740} y2={30} className="sim__datum" />
        <line x1={40} y1={30} x2={barA} y2={30} className="sim__force-a" strokeWidth={10} />
        <line x1={40} y1={65} x2={740} y2={65} className="sim__datum" />
        <line x1={40} y1={65} x2={barB} y2={65} className="sim__force-b" strokeWidth={10} />
        <line x1={40} y1={105} x2={740} y2={105} className="sim__datum" />
        <line x1={40} y1={105} x2={barFinal} y2={105} className="sim__dot is-match" strokeWidth={10} />
      </svg>

      <div className="sim__panel">
        <span className="sim__sliderLabel">{t('bodyA')}</span>
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={0.01}
            max={maxMassKg}
            step={0.01}
            value={massA}
            onChange={(e) => {
              setMassA(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('specificHeat')} (J/kg·K)
          <input
            type="range"
            min={100}
            max={4500}
            step={10}
            value={specificHeatA}
            onChange={(e) => setSpecificHeatA(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('temp')} (°C)
          <input
            type="range"
            min={0}
            max={maxTempC}
            step={1}
            value={tempA}
            onChange={(e) => setTempA(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="sim__panel">
        <span className="sim__sliderLabel">{t('bodyB')}</span>
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={0.01}
            max={maxMassKg}
            step={0.01}
            value={massB}
            onChange={(e) => {
              setMassB(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('specificHeat')} (J/kg·K)
          <input
            type="range"
            min={100}
            max={4500}
            step={10}
            value={specificHeatB}
            onChange={(e) => setSpecificHeatB(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('temp')} (°C)
          <input
            type="range"
            min={0}
            max={maxTempC}
            step={1}
            value={tempB}
            onChange={(e) => setTempB(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="sim__practice">
        <button type="button" onClick={applyWaterWaterPreset}>
          {t('waterWaterPreset')}
        </button>
        <button type="button" className="is-secondary" onClick={applyIronWaterPreset}>
          {t('ironWaterPreset')}
        </button>
      </div>

      <div className="sim__panel">
        <Readout label={t('finalTemp')} value={`${num(final.toFixed(1))} °C`} emphasis />
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
