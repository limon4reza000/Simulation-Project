import { useCallback, useMemo, useState } from 'react'
import { liquidPressure, atmospheresFromDepth } from '../../lib/pressure/liquidPressure'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_LIQUID_PRESSURE — তরলের ভেতর চাপ, চিত্র ৫.০২–৫.০৩
 *
 * Digitises §৫.৩ (pp. 134-136): a depth slider over a chosen liquid, live
 * P = hρg readout alongside the book's own simplified atm-per-10-m rule
 * used in both its whale and diver worked examples.
 */

const LIQUIDS = [
  { key: 'kerosene', labelBn: 'কেরোসিন', labelEn: 'Kerosene', densityKgM3: 800 },
  { key: 'water', labelBn: 'পানি', labelEn: 'Water', densityKgM3: 1000 },
  { key: 'mercury', labelBn: 'পারদ', labelEn: 'Mercury', densityKgM3: 13600 },
] as const

interface Config {
  maxDepthM?: number
}

type LiquidKey = (typeof LIQUIDS)[number]['key']

interface Params {
  depthM?: number
  liquidKey?: LiquidKey
}

const L = {
  title: { bn: 'তরলের ভেতর চাপ', en: 'Pressure in a Liquid' },
  liquid: { bn: 'তরল', en: 'Liquid' },
  depth: { bn: 'গভীরতা (h)', en: 'Depth (h)' },
  pressureLabel: { bn: 'চাপ (P = hρg)', en: 'Pressure (P = hρg)' },
  atmLabel: { bn: 'প্রায় (১০ মি./atm হিসেবে)', en: '≈ (at 10 m/atm)' },
  note: {
    bn: 'নির্দিষ্ট ঘনত্বের তরলে গভীরতার সাথে সাথে চাপ সমানুপাতিকভাবে বাড়ে।',
    en: 'For a given liquid, pressure rises in direct proportion to depth.',
  },
} as const

type LabelKey = keyof typeof L

export default function LiquidPressure({
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

  const maxDepthM = cfg.maxDepthM ?? 3000

  const [depth, setDepth] = useState(params.depthM ?? 500)
  const [liquidKey, setLiquidKey] = useState(params.liquidKey ?? 'water')
  const [reported, setReported] = useState(false)

  const liquid = useMemo(
    () => LIQUIDS.find((l) => l.key === liquidKey) ?? LIQUIDS[1],
    [liquidKey],
  )

  const P = useMemo(() => liquidPressure(depth, liquid.densityKgM3), [depth, liquid])
  const atm = useMemo(() => atmospheresFromDepth(depth), [depth])

  const report = useCallback(
    (nextDepth: number, nextLiquid: string) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'LIQUID_PRESSURE_COMPUTED',
          metadata: { depthM: nextDepth, liquidKey: nextLiquid, pressurePa: P },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, P, onActivity],
  )

  const columnFrac = Math.min(1, depth / maxDepthM)
  const markerY = 20 + columnFrac * 220

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 200 260" className="sim__svg" role="img" aria-label={t('title')}>
        <rect x={60} y={20} width={80} height={220} className="sim__object is-weak" />
        <rect x={60} y={markerY} width={80} height={240 - markerY} className="sim__object" />
        <line x1={40} y1={markerY} x2={60} y2={markerY} className="sim__marker" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('liquid')}
          <select
            value={liquidKey}
            onChange={(e) => {
              setLiquidKey(e.target.value as LiquidKey)
              report(depth, e.target.value)
            }}
          >
            {LIQUIDS.map((l) => (
              <option key={l.key} value={l.key}>
                {language === 'BN' ? l.labelBn : l.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('depth')} (m)
          <input
            type="range"
            min={0}
            max={maxDepthM}
            step={5}
            value={depth}
            onChange={(e) => {
              const v = Number(e.target.value)
              setDepth(v)
              report(v, liquidKey)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('pressureLabel')} value={`${num(P.toFixed(0))} Pa`} emphasis />
        <Readout label={t('atmLabel')} value={`${num(atm.toFixed(1))} atm`} />
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
