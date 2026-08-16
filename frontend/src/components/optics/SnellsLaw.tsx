import { useCallback, useMemo, useState } from 'react'
import { refractionAngle } from '../../lib/optics/snellsLaw'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_SNELLS_LAW — প্রতিসরণের সূত্র, চিত্র ৯.০১–৯.০৫
 *
 * Digitises §৯.১.১ (pp. 244-248): an adjustable incident angle and a chosen
 * pair of media, live refraction angle from n1 sin θ1 = n2 sin θ2 — bending
 * toward the normal entering a denser medium, away from it leaving one.
 */

const MEDIA = [
  { key: 'air', labelBn: 'বাতাস', labelEn: 'Air', n: 1.0 },
  { key: 'water', labelBn: 'পানি', labelEn: 'Water', n: 1.33 },
  { key: 'glass', labelBn: 'কাচ', labelEn: 'Glass', n: 1.52 },
  { key: 'diamond', labelBn: 'হীরা', labelEn: 'Diamond', n: 2.42 },
] as const

type MediumKey = (typeof MEDIA)[number]['key']

const BOUNDARY_Y = 150
const ORIGIN_X = 220
const RAY_LEN = 130

interface Config {
  maxAngleDeg?: number
}

interface Params {
  medium1Key?: MediumKey
  medium2Key?: MediumKey
  angleOfIncidenceDeg?: number
}

const L = {
  title: { bn: 'প্রতিসরণের সূত্র', en: "Snell's Law" },
  medium1: { bn: 'প্রথম মাধ্যম', en: 'First medium' },
  medium2: { bn: 'দ্বিতীয় মাধ্যম', en: 'Second medium' },
  incidence: { bn: 'আপতন কোণ (θ₁)', en: 'Angle of incidence (θ₁)' },
  refraction: { bn: 'প্রতিসরণ কোণ (θ₂)', en: 'Angle of refraction (θ₂)' },
  tir: { bn: 'পূর্ণ অভ্যন্তরীণ প্রতিফলন — প্রতিসরণ সম্ভব নয়', en: 'Total internal reflection — no refraction possible' },
  note: {
    bn: 'হালকা মাধ্যম থেকে ঘন মাধ্যমে গেলে রশ্মি লম্বের দিকে বেঁকে যায়।',
    en: 'Going from a lighter to a denser medium, the ray bends toward the normal.',
  },
} as const

type LabelKey = keyof typeof L

export default function SnellsLaw({
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

  const maxAngleDeg = cfg.maxAngleDeg ?? 80

  const [medium1Key, setMedium1Key] = useState<MediumKey>(params.medium1Key ?? 'air')
  const [medium2Key, setMedium2Key] = useState<MediumKey>(params.medium2Key ?? 'glass')
  const [incidence, setIncidence] = useState(params.angleOfIncidenceDeg ?? 45)
  const [reported, setReported] = useState(false)

  const n1 = MEDIA.find((m) => m.key === medium1Key)?.n ?? 1
  const n2 = MEDIA.find((m) => m.key === medium2Key)?.n ?? 1.52

  const refraction = useMemo(() => {
    try {
      return refractionAngle(n1, n2, incidence)
    } catch {
      return null
    }
  }, [n1, n2, incidence])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'SNELLS_LAW_EXPLORED',
        metadata: { medium1Key, medium2Key, angleOfIncidenceDeg: incidence },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, medium1Key, medium2Key, incidence, onActivity])

  const incRad = (incidence * Math.PI) / 180
  const incX = ORIGIN_X - RAY_LEN * Math.sin(incRad)
  const incY = BOUNDARY_Y - RAY_LEN * Math.cos(incRad)
  const refRad = refraction !== null ? (refraction * Math.PI) / 180 : 0
  const refX = ORIGIN_X + RAY_LEN * Math.sin(refRad)
  const refY = BOUNDARY_Y + RAY_LEN * Math.cos(refRad)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 440 300" className="sim__svg" role="img" aria-label={t('title')}>
        <defs>
          <marker id="snell-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="sim__index" />
          </marker>
        </defs>
        <rect x={20} y={20} width={400} height={130} className="sim__object is-weak" />
        <rect x={20} y={150} width={400} height={130} className="sim__object" />
        <line
          x1={ORIGIN_X}
          y1={BOUNDARY_Y - 60}
          x2={ORIGIN_X}
          y2={BOUNDARY_Y + 60}
          className="sim__datum"
          strokeDasharray="4 4"
        />
        <line
          x1={incX}
          y1={incY}
          x2={ORIGIN_X}
          y2={BOUNDARY_Y}
          className="sim__marker"
          markerEnd="url(#snell-arrow)"
        />
        {refraction !== null && (
          <line
            x1={ORIGIN_X}
            y1={BOUNDARY_Y}
            x2={refX}
            y2={refY}
            className="sim__force-b"
            strokeWidth={3}
            markerEnd="url(#snell-arrow)"
          />
        )}
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('medium1')}
          <select
            value={medium1Key}
            onChange={(e) => {
              setMedium1Key(e.target.value as MediumKey)
              report()
            }}
          >
            {MEDIA.map((m) => (
              <option key={m.key} value={m.key}>
                {language === 'BN' ? m.labelBn : m.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('medium2')}
          <select
            value={medium2Key}
            onChange={(e) => {
              setMedium2Key(e.target.value as MediumKey)
              report()
            }}
          >
            {MEDIA.map((m) => (
              <option key={m.key} value={m.key}>
                {language === 'BN' ? m.labelBn : m.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('incidence')}
          <input
            type="range"
            min={0}
            max={maxAngleDeg}
            step={1}
            value={incidence}
            onChange={(e) => {
              setIncidence(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      {refraction !== null ? (
        <div className="sim__panel">
          <Readout label={t('incidence')} value={`${num(incidence)}°`} />
          <Readout label={t('refraction')} value={`${num(refraction.toFixed(1))}°`} emphasis />
        </div>
      ) : (
        <p className="sim__note">{t('tir')}</p>
      )}

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
