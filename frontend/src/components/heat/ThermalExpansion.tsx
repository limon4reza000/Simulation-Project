import { useCallback, useMemo, useState } from 'react'
import {
  expandedLength,
  areaExpansionCoefficient,
  volumeExpansionCoefficient,
} from '../../lib/heat/thermalExpansion'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_THERMAL_EXPANSION — কঠিন পদার্থের প্রসারণ, চিত্র ৬.০৩–৬.০৪
 *
 * Digitises §৬.৩.১ (pp. 166-171): a rod heated through a temperature range,
 * with live length/area/volume readouts computed from one linear expansion
 * coefficient alpha and the book's own derived beta=2alpha, gamma=3alpha —
 * three related quantities from one material constant, exactly as the book
 * derives them from each other rather than independently.
 */

const MATERIALS = [
  { key: 'copper', labelBn: 'তামা', labelEn: 'Copper', alpha: 16.7e-6 },
  { key: 'gold', labelBn: 'সোনা', labelEn: 'Gold', alpha: 14e-6 },
  { key: 'steel', labelBn: 'ইস্পাত', labelEn: 'Steel', alpha: 12e-6 },
] as const

type MaterialKey = (typeof MATERIALS)[number]['key']

interface Config {
  initialLengthM?: number
  maxTempC?: number
}

interface Params {
  materialKey?: MaterialKey
  tempC?: number
}

const L = {
  title: { bn: 'কঠিন পদার্থের প্রসারণ', en: 'Thermal Expansion of a Solid' },
  material: { bn: 'উপাদান', en: 'Material' },
  temp: { bn: 'তাপমাত্রা (T)', en: 'Temperature (T)' },
  length: { bn: 'দৈর্ঘ্য (L₂ = L₁ + αL₁ΔT)', en: 'Length (L₂ = L₁ + αL₁ΔT)' },
  areaCoeff: { bn: 'ক্ষেত্রফল প্রসারণ সহগ (β = 2α)', en: 'Area coefficient (β = 2α)' },
  volumeCoeff: { bn: 'আয়তন প্রসারণ সহগ (γ = 3α)', en: 'Volume coefficient (γ = 3α)' },
  note: {
    bn: 'একই α থেকে β = 2α এবং γ = 3α পাওয়া যায় — আলাদাভাবে পরিমাপ করার দরকার নেই।',
    en: 'β = 2α and γ = 3α both follow from the same α — no separate measurement needed.',
  },
} as const

type LabelKey = keyof typeof L

const START_TEMP_C = 20

export default function ThermalExpansion({
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

  const initialLengthM = cfg.initialLengthM ?? 10
  const maxTempC = cfg.maxTempC ?? 500

  const [materialKey, setMaterialKey] = useState<MaterialKey>(params.materialKey ?? 'copper')
  const [tempC, setTempC] = useState(params.tempC ?? 120)
  const [reported, setReported] = useState(false)

  const material = useMemo(
    () => MATERIALS.find((m) => m.key === materialKey) ?? MATERIALS[0],
    [materialKey],
  )

  const length = useMemo(
    () => expandedLength(initialLengthM, material.alpha, START_TEMP_C, tempC),
    [initialLengthM, material, tempC],
  )
  const beta = useMemo(() => areaExpansionCoefficient(material.alpha), [material])
  const gamma = useMemo(() => volumeExpansionCoefficient(material.alpha), [material])

  const report = useCallback(
    (nextTemp: number, nextMaterial: string) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'THERMAL_EXPANSION_EXPLORED',
          metadata: { tempC: nextTemp, materialKey: nextMaterial },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const barLenPx = 40 + Math.min(700, (length / initialLengthM) * 600)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 800 120" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={40} y1={60} x2={840} y2={60} className="sim__datum" />
        <rect x={40} y={44} width={barLenPx} height={32} className="sim__object" rx={4} />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('material')}
          <select
            value={materialKey}
            onChange={(e) => {
              const key = e.target.value as MaterialKey
              setMaterialKey(key)
              report(tempC, key)
            }}
          >
            {MATERIALS.map((m) => (
              <option key={m.key} value={m.key}>
                {language === 'BN' ? m.labelBn : m.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('temp')} (°C)
          <input
            type="range"
            min={START_TEMP_C}
            max={maxTempC}
            step={5}
            value={tempC}
            onChange={(e) => {
              const v = Number(e.target.value)
              setTempC(v)
              report(v, materialKey)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('length')} value={`${num(length.toFixed(4))} m`} emphasis />
        <Readout label={t('areaCoeff')} value={num((beta * 1e6).toFixed(1))} />
        <Readout label={t('volumeCoeff')} value={num((gamma * 1e6).toFixed(1))} />
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
