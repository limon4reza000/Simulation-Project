import { useCallback, useMemo, useState } from 'react'
import { efficiency } from '../../lib/energy/powerEfficiency'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_POWER_EFFICIENCY — অনুসন্ধান ৪.০১ ও §৪.৮
 *
 * Digitises the book's own physical-power investigation (p. 122: climb a
 * known height in measured time, P = mgh/t) combined with the efficiency
 * worked example (p. 121: a motor rated at some power supplies more energy
 * than the useful work it does, the shortfall quantified as loss). Same
 * investigation shape as Chapter 2's inclined-plane and Chapter 3's
 * friction-incline artefacts — a slider-driven lab rather than an animation,
 * reused rather than reinvented.
 */

interface Config {
  maxPowerW?: number
  maxTimeS?: number
  maxMassKg?: number
  maxHeightM?: number
}

interface Params {
  motorPowerW?: number
  timeS?: number
  massKg?: number
  heightM?: number
}

const L = {
  title: { bn: 'ক্ষমতা ও কর্মদক্ষতা', en: 'Power and Efficiency' },
  motorPower: { bn: 'মোটরের ক্ষমতা', en: "Motor's rated power" },
  time: { bn: 'সময় (t)', en: 'Time (t)' },
  mass: { bn: 'ভর (m)', en: 'Mass (m)' },
  height: { bn: 'উচ্চতা (h)', en: 'Height (h)' },
  workDone: { bn: 'কাজের পরিমাণ (mgh)', en: 'Work done (mgh)' },
  energySupplied: { bn: 'প্রদত্ত শক্তি (Pt)', en: 'Energy supplied (Pt)' },
  loss: { bn: 'শক্তির অপচয়', en: 'Energy lost' },
  efficiencyLabel: { bn: 'কর্মদক্ষতা (η)', en: 'Efficiency (η)' },
  note: {
    bn: 'কর্মদক্ষতা = (কাজের পরিমাণ ÷ প্রদত্ত শক্তি) × ১০০%। প্রদত্ত শক্তির চেয়ে বেশি কাজ কখনো হয় না।',
    en: 'Efficiency = (work done ÷ energy supplied) × 100%. Work done never exceeds energy supplied.',
  },
} as const

type LabelKey = keyof typeof L

export default function PowerEfficiency({
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

  const maxPowerW = cfg.maxPowerW ?? 2000
  const maxTimeS = cfg.maxTimeS ?? 30
  const maxMassKg = cfg.maxMassKg ?? 200
  const maxHeightM = cfg.maxHeightM ?? 20

  const [motorPower, setMotorPower] = useState(params.motorPowerW ?? 1000)
  const [time, setTime] = useState(params.timeS ?? 15)
  const [mass, setMass] = useState(params.massKg ?? 100)
  const [height, setHeight] = useState(params.heightM ?? 10)
  const [reported, setReported] = useState(false)

  const result = useMemo(
    () => efficiency(motorPower, time, mass, height),
    [motorPower, time, mass, height],
  )

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'POWER_EFFICIENCY_COMPUTED',
        metadata: {
          motorPowerW: motorPower,
          timeS: time,
          massKg: mass,
          heightM: height,
          efficiencyPercent: result.efficiencyPercent,
        },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, motorPower, time, mass, height, result.efficiencyPercent, onActivity])

  const barMax = result.energySupplied || 1
  const workFrac = (result.workDone / barMax) * 100
  const lossFrac = (result.loss / barMax) * 100

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 900 60" className="sim__svg" role="img" aria-label={t('title')}>
        <rect x={0} y={15} width={900} height={30} className="sim__object is-weak" />
        <rect x={0} y={15} width={(workFrac / 100) * 900} height={30} className="sim__object" />
        <rect
          x={(workFrac / 100) * 900}
          y={15}
          width={(lossFrac / 100) * 900}
          height={30}
          className="sim__dot is-match"
        />
        <line
          x1={(workFrac / 100) * 900}
          y1={10}
          x2={(workFrac / 100) * 900}
          y2={50}
          className="sim__datum"
        />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('motorPower')} (W)
          <input
            type="range"
            min={100}
            max={maxPowerW}
            step={100}
            value={motorPower}
            onChange={(e) => {
              setMotorPower(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('time')} (s)
          <input
            type="range"
            min={1}
            max={maxTimeS}
            step={1}
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={1}
            max={maxMassKg}
            step={1}
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('height')} (m)
          <input
            type="range"
            min={0}
            max={maxHeightM}
            step={0.5}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('workDone')} value={`${num(result.workDone.toFixed(0))} J`} />
        <Readout label={t('energySupplied')} value={`${num(result.energySupplied.toFixed(0))} J`} />
        <Readout label={t('loss')} value={`${num(result.loss.toFixed(0))} J`} />
        <Readout
          label={t('efficiencyLabel')}
          value={`${num(result.efficiencyPercent.toFixed(1))}%`}
          emphasis
        />
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
