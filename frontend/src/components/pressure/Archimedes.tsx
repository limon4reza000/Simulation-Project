import { useCallback, useMemo, useState } from 'react'
import { submergedFraction, floats } from '../../lib/pressure/archimedes'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ARCHIMEDES — প্লবতা ও ভাসা-ডোবা, চিত্র ৫.০৪
 *
 * Digitises §৫.৩.১-৫.৩.২ (pp. 137-140): an object of adjustable density
 * dropped into a chosen fluid, floating at exactly the submerged fraction
 * ρ_object/ρ_fluid or sinking outright — the same relation behind the
 * book's own wood-in-water (50%) and wood-in-seawater (48.5%) examples.
 */

const FLUIDS = [
  { key: 'water', labelBn: 'পানি', labelEn: 'Water', densityKgM3: 1000 },
  { key: 'seawater', labelBn: 'সমুদ্রের পানি', labelEn: 'Sea water', densityKgM3: 1030 },
  { key: 'mercury', labelBn: 'পারদ', labelEn: 'Mercury', densityKgM3: 13600 },
] as const

interface Config {
  maxObjectDensity?: number
}

type FluidKey = (typeof FLUIDS)[number]['key']

interface Params {
  objectDensityKgM3?: number
  fluidKey?: FluidKey
}

const L = {
  title: { bn: 'প্লবতা ও ভাসা-ডোবা', en: 'Buoyancy: Floating and Sinking' },
  fluid: { bn: 'তরল', en: 'Fluid' },
  objectDensity: { bn: 'বস্তুর ঘনত্ব', en: "Object's density" },
  submergedFractionLabel: { bn: 'ডুবন্ত অংশ', en: 'Submerged fraction' },
  status: { bn: 'অবস্থা', en: 'Status' },
  floating: { bn: 'ভাসছে', en: 'Floating' },
  sinking: { bn: 'ডুবে যাচ্ছে', en: 'Sinking' },
  note: {
    bn: 'ভাসন্ত বস্তুর ডুবন্ত অংশ = বস্তুর ঘনত্ব ÷ তরলের ঘনত্ব — কাঠ পানিতে ৫০% ডুবে থাকে, সমুদ্রের পানিতে মাত্র ৪৮.৫%।',
    en: 'A floating object submerges to exactly density_object ÷ density_fluid — wood sits 50% submerged in water, only 48.5% in sea water.',
  },
} as const

type LabelKey = keyof typeof L

export default function Archimedes({
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

  const maxObjectDensity = cfg.maxObjectDensity ?? 2000

  const [objectDensity, setObjectDensity] = useState(params.objectDensityKgM3 ?? 500)
  const [fluidKey, setFluidKey] = useState(params.fluidKey ?? 'water')
  const [reported, setReported] = useState(false)

  const fluid = useMemo(
    () => FLUIDS.find((f) => f.key === fluidKey) ?? FLUIDS[0],
    [fluidKey],
  )

  const isFloating = useMemo(
    () => floats(objectDensity, fluid.densityKgM3),
    [objectDensity, fluid],
  )
  const fraction = useMemo(
    () => Math.min(1, submergedFraction(objectDensity, fluid.densityKgM3)),
    [objectDensity, fluid],
  )

  const report = useCallback(
    (nextDensity: number, nextFluid: string) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'ARCHIMEDES_TESTED',
          metadata: { objectDensityKgM3: nextDensity, fluidKey: nextFluid },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  // Object box: 60x60, sinks to the container floor if it does not float.
  const boxSize = 60
  const waterTop = 40
  const waterBottom = 240
  const floorY = waterBottom - boxSize
  const submergedPx = fraction * boxSize
  const boxTop = isFloating ? waterTop + (boxSize - submergedPx) : floorY

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 200 260" className="sim__svg" role="img" aria-label={t('title')}>
        <rect x={30} y={waterTop} width={140} height={waterBottom - waterTop} className="sim__object is-weak" />
        <rect x={70} y={boxTop} width={boxSize} height={boxSize} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('fluid')}
          <select
            value={fluidKey}
            onChange={(e) => {
              setFluidKey(e.target.value as FluidKey)
              report(objectDensity, e.target.value)
            }}
          >
            {FLUIDS.map((f) => (
              <option key={f.key} value={f.key}>
                {language === 'BN' ? f.labelBn : f.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('objectDensity')} (kg/m³)
          <input
            type="range"
            min={100}
            max={maxObjectDensity}
            step={10}
            value={objectDensity}
            onChange={(e) => {
              const v = Number(e.target.value)
              setObjectDensity(v)
              report(v, fluidKey)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('status')} value={isFloating ? t('floating') : t('sinking')} emphasis={!isFloating} />
        {isFloating && (
          <Readout label={t('submergedFractionLabel')} value={`${num((fraction * 100).toFixed(1))}%`} emphasis />
        )}
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
