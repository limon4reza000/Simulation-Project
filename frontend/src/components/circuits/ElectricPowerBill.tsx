import { useCallback, useMemo, useState } from 'react'
import { electricityBill } from '../../lib/circuits/electricPower'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ELECTRIC_POWER — তড়িৎ ক্ষমতা ও বিদ্যুৎ বিল, §১১.৩
 *
 * Digitises P = VI = I²R = V²/R as a household electricity-cost calculator
 * (pp. 317-319): an appliance's rated power and daily usage give energy in
 * kWh ("ইউনিট") and cost at a per-unit rate.
 */

interface Config {
  maxPowerW?: number
  maxHoursPerDay?: number
  maxDays?: number
}

interface Params {
  powerW?: number
  hoursPerDay?: number
  days?: number
  takaPerUnit?: number
}

const L = {
  title: { bn: 'তড়িৎ ক্ষমতা ও বিদ্যুৎ বিল', en: 'Electric Power and Electricity Bill' },
  power: { bn: 'ক্ষমতা (P)', en: 'Power (P)' },
  hoursPerDay: { bn: 'দৈনিক ব্যবহার', en: 'Hours per day' },
  days: { bn: 'দিনসংখ্যা', en: 'Days' },
  rate: { bn: 'প্রতি ইউনিটের মূল্য', en: 'Price per unit' },
  units: { bn: 'ব্যয়িত শক্তি (ইউনিট)', en: 'Energy used (units)' },
  cost: { bn: 'মোট বিল', en: 'Total bill' },
  note: {
    bn: 'ইউনিট (kWh) = (ক্ষমতা × সময়) ÷ ১০০০ — ক্ষমতা ওয়াটে, সময় ঘণ্টায়।',
    en: 'Units (kWh) = (power × time) / 1000 — power in watts, time in hours.',
  },
} as const

type LabelKey = keyof typeof L

export default function ElectricPowerBill({
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
  const maxHoursPerDay = cfg.maxHoursPerDay ?? 24
  const maxDays = cfg.maxDays ?? 31

  const [powerW, setPowerW] = useState(params.powerW ?? 60)
  const [hoursPerDay, setHoursPerDay] = useState(params.hoursPerDay ?? 5)
  const [days, setDays] = useState(params.days ?? 30)
  const [takaPerUnit, setTakaPerUnit] = useState(params.takaPerUnit ?? 10)
  const [reported, setReported] = useState(false)

  const bill = useMemo(
    () => electricityBill(powerW, hoursPerDay, days, takaPerUnit),
    [powerW, hoursPerDay, days, takaPerUnit],
  )

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'ELECTRICITY_BILL_COMPUTED',
        metadata: { powerW, hoursPerDay, days, units: bill.units, costTaka: bill.costTaka },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, powerW, hoursPerDay, days, bill, onActivity])

  const barWidth = Math.min(900, bill.units * 20)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 900 60" className="sim__svg" role="img" aria-label={t('units')}>
        <rect x={0} y={10} width={900} height={40} className="sim__object is-weak" />
        <rect x={0} y={10} width={barWidth} height={40} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('power')} (W)
          <input
            type="range"
            min={1}
            max={maxPowerW}
            step={1}
            value={powerW}
            onChange={(e) => {
              setPowerW(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('hoursPerDay')}
          <input
            type="range"
            min={0}
            max={maxHoursPerDay}
            step={0.5}
            value={hoursPerDay}
            onChange={(e) => {
              setHoursPerDay(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('days')}
          <input
            type="range"
            min={1}
            max={maxDays}
            step={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('rate')} (৳)
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={takaPerUnit}
            onChange={(e) => setTakaPerUnit(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('units')} value={num(bill.units.toFixed(2))} />
        <Readout label={t('cost')} value={`৳ ${num(bill.costTaka.toFixed(2))}`} emphasis />
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
