import { useCallback, useMemo, useState } from 'react'
import {
  isBlocked,
  recommendedShield,
  type RadiationType,
  type ShieldMaterial,
} from '../../lib/nuclear/radiationShielding'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_RADIATION_SHIELDING — আলফা, বিটা, গামা রশ্মি, চিত্র ১৩.০১
 *
 * Digitises §১৩.১.১-১৩.১.৩ (pp. 349-352) as a rule engine: given a radiation
 * type and a shield material/thickness, predicts whether it is blocked,
 * reproducing চিত্র ১৩.০১'s own three side-by-side thresholds.
 */

const RADIATION_TYPES: readonly RadiationType[] = ['alpha', 'beta', 'gamma']
const MATERIALS: readonly ShieldMaterial[] = ['paper', 'aluminium', 'lead']

interface Config {
  maxThicknessMm?: number
}

interface Params {
  radiation?: RadiationType
  material?: ShieldMaterial
  thicknessMm?: number
}

const L = {
  title: { bn: 'তেজস্ক্রিয় বিকিরণ ও প্রতিরক্ষা', en: 'Radiation and Shielding' },
  radiation: { bn: 'বিকিরণের ধরন', en: 'Radiation type' },
  alpha: { bn: 'আলফা', en: 'Alpha' },
  beta: { bn: 'বিটা', en: 'Beta' },
  gamma: { bn: 'গামা', en: 'Gamma' },
  material: { bn: 'প্রতিরক্ষা উপাদান', en: 'Shield material' },
  paper: { bn: 'কাগজ', en: 'Paper' },
  aluminium: { bn: 'অ্যালুমিনিয়াম', en: 'Aluminium' },
  lead: { bn: 'সিসা', en: 'Lead' },
  thickness: { bn: 'পুরুত্ব', en: 'Thickness' },
  status: { bn: 'অবস্থা', en: 'Status' },
  blocked: { bn: 'অবরুদ্ধ', en: 'Blocked' },
  passing: { bn: 'ভেদ করে যাচ্ছে', en: 'Passing through' },
  recommended: { bn: 'প্রস্তাবিত উপাদান', en: 'Recommended material' },
  note: {
    bn: 'আলফা কাগজেই থামে, বিটার জন্য কয়েক মিমি অ্যালুমিনিয়াম দরকার, গামার জন্য কয়েক সেমি সিসা দরকার।',
    en: 'Alpha stops at paper, beta needs a few mm of aluminium, gamma needs several cm of lead.',
  },
} as const

type LabelKey = keyof typeof L

export default function RadiationShielding({
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

  const maxThicknessMm = cfg.maxThicknessMm ?? 40

  const [radiation, setRadiation] = useState<RadiationType>(params.radiation ?? 'beta')
  const [material, setMaterial] = useState<ShieldMaterial>(params.material ?? 'paper')
  const [thickness, setThickness] = useState(params.thicknessMm ?? 1)
  const [reported, setReported] = useState(false)

  const blocked = useMemo(
    () => isBlocked(radiation, material, thickness),
    [radiation, material, thickness],
  )
  const recommended = useMemo(() => recommendedShield(radiation), [radiation])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'RADIATION_SHIELDING_TESTED',
        metadata: { radiation, material, thicknessMm: thickness, blocked },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, radiation, material, thickness, blocked, onActivity])

  const rayLenPx = blocked ? 120 : 320

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 400 100" className="sim__svg" role="img" aria-label={t('title')}>
        <line
          x1={20}
          y1={50}
          x2={20 + rayLenPx}
          y2={50}
          className={blocked ? 'sim__dot is-match' : 'sim__force-b'}
          strokeWidth={4}
        />
        <rect x={140} y={10} width={20} height={80} className="sim__object" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('radiation')}
          <select
            value={radiation}
            onChange={(e) => {
              setRadiation(e.target.value as RadiationType)
              report()
            }}
          >
            {RADIATION_TYPES.map((r) => (
              <option key={r} value={r}>
                {t(r)}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('material')}
          <select
            value={material}
            onChange={(e) => {
              setMaterial(e.target.value as ShieldMaterial)
              report()
            }}
          >
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="sim__control">
          {t('thickness')} (mm)
          <input
            type="range"
            min={0}
            max={maxThicknessMm}
            step={1}
            value={thickness}
            onChange={(e) => {
              setThickness(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('thickness')} value={`${num(thickness)} mm`} />
        <Readout label={t('status')} value={blocked ? t('blocked') : t('passing')} emphasis={!blocked} />
        <Readout label={t('recommended')} value={t(recommended)} />
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
