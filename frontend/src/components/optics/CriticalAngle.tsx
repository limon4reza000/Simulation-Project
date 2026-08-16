import { useCallback, useMemo, useState } from 'react'
import { criticalAngle, isTotalInternalReflection } from '../../lib/optics/criticalAngle'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_CRITICAL_ANGLE — পূর্ণ অভ্যন্তরীণ প্রতিফলন, চিত্র ৯.০৬–৯.০৮
 *
 * Digitises §৯.২ (pp. 248-251): an adjustable incidence angle inside a
 * denser medium, showing ordinary refraction below the critical angle and
 * total internal reflection above it, with a live critical-angle readout.
 */

const BOUNDARY_Y = 150
const ORIGIN_X = 220
const RAY_LEN = 130

interface Config {
  nDense?: number
  nLight?: number
}

interface Params {
  incidenceDeg?: number
}

const L = {
  title: { bn: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন', en: 'Total Internal Reflection' },
  incidence: { bn: 'আপতন কোণ', en: 'Angle of incidence' },
  criticalAngleLabel: { bn: 'ক্রান্তি কোণ (θc)', en: 'Critical angle (θc)' },
  status: { bn: 'অবস্থা', en: 'Status' },
  refracts: { bn: 'প্রতিসরিত হচ্ছে', en: 'Refracting' },
  tir: { bn: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন', en: 'Total internal reflection' },
  note: {
    bn: 'ক্রান্তি কোণের বেশি কোণে আপতিত হলে আলো আর প্রতিসরিত না হয়ে সম্পূর্ণ প্রতিফলিত হয়ে যায়।',
    en: 'Beyond the critical angle, light no longer refracts at all — it reflects completely instead.',
  },
} as const

type LabelKey = keyof typeof L

export default function CriticalAngle({
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

  const nDense = cfg.nDense ?? 1.52
  const nLight = cfg.nLight ?? 1

  const [incidence, setIncidence] = useState(params.incidenceDeg ?? 30)
  const [reported, setReported] = useState(false)

  const thetaC = useMemo(() => criticalAngle(nDense, nLight), [nDense, nLight])
  const tir = useMemo(
    () => isTotalInternalReflection(nDense, nLight, incidence),
    [nDense, nLight, incidence],
  )

  const report = useCallback(
    (nextIncidence: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'CRITICAL_ANGLE_EXPLORED',
          metadata: { incidenceDeg: nextIncidence, tir: isTotalInternalReflection(nDense, nLight, nextIncidence) },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, nDense, nLight, onActivity],
  )

  const incRad = (incidence * Math.PI) / 180
  const incX = ORIGIN_X - RAY_LEN * Math.sin(incRad)
  const incY = BOUNDARY_Y + RAY_LEN * Math.cos(incRad)

  // Reflected ray (mirrors the incident ray about the boundary).
  const refX = ORIGIN_X + RAY_LEN * Math.sin(incRad)
  const refY = incY

  // Refracted ray, only when not undergoing TIR.
  const outRad = !tir ? Math.asin((nDense / nLight) * Math.sin(incRad)) : 0
  const outX = ORIGIN_X + RAY_LEN * Math.sin(outRad)
  const outY = BOUNDARY_Y - RAY_LEN * Math.cos(outRad)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 440 300" className="sim__svg" role="img" aria-label={t('title')}>
        <defs>
          <marker id="tir-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="sim__index" />
          </marker>
        </defs>
        <rect x={20} y={20} width={400} height={130} className="sim__object is-weak" />
        <rect x={20} y={150} width={400} height={130} className="sim__object" />
        <line
          x1={incX}
          y1={incY}
          x2={ORIGIN_X}
          y2={BOUNDARY_Y}
          className="sim__marker"
          markerEnd="url(#tir-arrow)"
        />
        {tir ? (
          <line
            x1={ORIGIN_X}
            y1={BOUNDARY_Y}
            x2={refX}
            y2={refY}
            className="sim__dot is-match"
            strokeWidth={3}
            markerEnd="url(#tir-arrow)"
          />
        ) : (
          <line
            x1={ORIGIN_X}
            y1={BOUNDARY_Y}
            x2={outX}
            y2={outY}
            className="sim__force-b"
            strokeWidth={3}
            markerEnd="url(#tir-arrow)"
          />
        )}
      </svg>

      <label className="sim__control">
        {t('incidence')}
        <input
          type="range"
          min={0}
          max={89}
          step={1}
          value={incidence}
          onChange={(e) => {
            const v = Number(e.target.value)
            setIncidence(v)
            report(v)
          }}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('criticalAngleLabel')} value={`${num(thetaC.toFixed(1))}°`} />
        <Readout label={t('status')} value={tir ? t('tir') : t('refracts')} emphasis={tir} />
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
