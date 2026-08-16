import { useCallback, useMemo, useState } from 'react'
import { chargeStored, storedEnergy } from '../../lib/electricity/capacitor'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_CAPACITOR_ENERGY — ধারক, চিত্র ১০.১৫
 *
 * Digitises §১০.৭ (pp. 289-290): an adjustable capacitance and voltage, live
 * stored energy from energy = ½CV², plus Q = CV.
 */

interface Config {
  maxCapacitanceUF?: number
  maxVoltageV?: number
}

interface Params {
  capacitanceUF?: number
  voltageV?: number
}

const L = {
  title: { bn: 'ধারকে সঞ্চিত শক্তি', en: 'Energy Stored in a Capacitor' },
  capacitance: { bn: 'ধারকত্ব (C)', en: 'Capacitance (C)' },
  voltage: { bn: 'ভোল্টেজ (V)', en: 'Voltage (V)' },
  charge: { bn: 'সঞ্চিত আধান (Q = CV)', en: 'Charge stored (Q = CV)' },
  energy: { bn: 'সঞ্চিত শক্তি (½CV²)', en: 'Energy stored (½CV²)' },
  note: {
    bn: 'ভোল্টেজ দ্বিগুণ করলে সঞ্চিত শক্তি চারগুণ হয়ে যায় — শক্তি ভোল্টেজের বর্গের সমানুপাতিক।',
    en: 'Doubling the voltage quadruples the stored energy — energy scales with the square of voltage.',
  },
} as const

type LabelKey = keyof typeof L

export default function CapacitorEnergy({
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

  const maxCapacitanceUF = cfg.maxCapacitanceUF ?? 100
  const maxVoltageV = cfg.maxVoltageV ?? 50

  const [capacitanceUF, setCapacitanceUF] = useState(params.capacitanceUF ?? 20)
  const [voltage, setVoltage] = useState(params.voltageV ?? 10)
  const [reported, setReported] = useState(false)

  const capacitanceF = capacitanceUF * 1e-6

  const charge = useMemo(() => chargeStored(capacitanceF, voltage), [capacitanceF, voltage])
  const energy = useMemo(() => storedEnergy(capacitanceF, voltage), [capacitanceF, voltage])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'CAPACITOR_ENERGY_COMPUTED',
        metadata: { capacitanceUF, voltageV: voltage, energyJ: energy },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, capacitanceUF, voltage, energy, onActivity])

  const barWidth = Math.min(800, energy * 1e6)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 900 60" className="sim__svg" role="img" aria-label={t('energy')}>
        <rect x={0} y={10} width={900} height={40} className="sim__object is-weak" />
        <rect x={0} y={10} width={barWidth} height={40} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('capacitance')} (µF)
          <input
            type="range"
            min={1}
            max={maxCapacitanceUF}
            step={1}
            value={capacitanceUF}
            onChange={(e) => {
              setCapacitanceUF(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('voltage')} (V)
          <input
            type="range"
            min={0}
            max={maxVoltageV}
            step={0.5}
            value={voltage}
            onChange={(e) => {
              setVoltage(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('charge')} value={`${num((charge * 1e6).toFixed(1))} µC`} />
        <Readout label={t('energy')} value={`${num((energy * 1e3).toFixed(3))} mJ`} emphasis />
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
