import { useCallback, useMemo, useState } from 'react'
import { wireResistance, MATERIALS } from '../../lib/circuits/wireResistance'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_WIRE_RESISTANCE — রোধ, R = ρL/A
 *
 * Digitises §১১.২.২ (pp. 306-309): a material selector and adjustable
 * length/cross-section, live resistance from R = ρL/A.
 */

type MaterialKey = (typeof MATERIALS)[number]['key']

interface Config {
  maxLengthM?: number
  radiusM?: number
}

interface Params {
  materialKey?: MaterialKey
  lengthM?: number
}

const L = {
  title: { bn: 'তারের রোধ', en: "A Wire's Resistance" },
  material: { bn: 'উপাদান', en: 'Material' },
  length: { bn: 'দৈর্ঘ্য (L)', en: 'Length (L)' },
  resistance: { bn: 'রোধ (R = ρL/A)', en: 'Resistance (R = ρL/A)' },
  note: {
    bn: 'একই দৈর্ঘ্য ও প্রস্থচ্ছেদে নাইক্রোমের রোধ রুপার চেয়ে বহুগুণ বেশি — এ কারণেই হিটার কয়েলে নাইক্রোম ব্যবহার করা হয়।',
    en: 'At the same length and thickness, nichrome has far more resistance than silver — why heater coils use nichrome.',
  },
} as const

type LabelKey = keyof typeof L

const RADIUS_M = 0.0001 // 0.1 mm, the book's own realistic worked-example radius

export default function WireResistance({
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

  const maxLengthM = cfg.maxLengthM ?? 5
  const radiusM = cfg.radiusM ?? RADIUS_M
  const areaM2 = Math.PI * radiusM * radiusM

  const [materialKey, setMaterialKey] = useState<MaterialKey>(params.materialKey ?? 'copper')
  const [length, setLength] = useState(params.lengthM ?? 1.84)
  const [reported, setReported] = useState(false)

  const material = useMemo(
    () => MATERIALS.find((m) => m.key === materialKey) ?? MATERIALS[1],
    [materialKey],
  )

  const resistance = useMemo(
    () => wireResistance(material.resistivity, length, areaM2),
    [material, length, areaM2],
  )

  const report = useCallback(
    (nextLength: number, nextMaterial: string) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'WIRE_RESISTANCE_EXPLORED',
          metadata: { materialKey: nextMaterial, lengthM: nextLength },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const barLen = 40 + Math.min(700, (length / maxLengthM) * 700)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 800 100" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={40} y1={50} x2={760} y2={50} className="sim__datum" />
        <rect x={40} y={40} width={barLen - 40} height={20} className="sim__object" rx={3} />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('material')}
          <select
            value={materialKey}
            onChange={(e) => {
              const key = e.target.value as MaterialKey
              setMaterialKey(key)
              report(length, key)
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
          {t('length')} (m)
          <input
            type="range"
            min={0.01}
            max={maxLengthM}
            step={0.01}
            value={length}
            onChange={(e) => {
              const v = Number(e.target.value)
              setLength(v)
              report(v, materialKey)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('resistance')} value={`${num(resistance.toFixed(2))} Ω`} emphasis />
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
