import { useCallback, useMemo, useState } from 'react'
import { lensPower } from '../../lib/optics/lensPower'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_LENS_POWER — লেন্সের ক্ষমতা, §৯.৪.৩
 *
 * Digitises P = 1/f directly (p. 264-265): an adjustable signed focal length
 * with a live power readout in diopters, positive for convex, negative for
 * concave.
 */

interface Config {
  maxFocalLengthM?: number
}

interface Params {
  focalLengthM?: number
}

const L = {
  title: { bn: 'লেন্সের ক্ষমতা', en: 'Power of a Lens' },
  focal: { bn: 'ফোকাস দূরত্ব (f) — উত্তলের জন্য ধনাত্মক, অবতলের জন্য ঋণাত্মক', en: 'Focal length (f) — positive for convex, negative for concave' },
  power: { bn: 'ক্ষমতা (P = 1/f)', en: 'Power (P = 1/f)' },
  lensType: { bn: 'লেন্সের ধরন', en: 'Lens type' },
  convex: { bn: 'উত্তল', en: 'Convex' },
  concave: { bn: 'অবতল', en: 'Concave' },
  note: {
    bn: 'ফোকাস দূরত্ব যত কম, ক্ষমতা তত বেশি — কম ফোকাস দূরত্বের লেন্স আলোকে বেশি বাঁকায়।',
    en: 'The shorter the focal length, the greater the power — a short-focal-length lens bends light more sharply.',
  },
} as const

type LabelKey = keyof typeof L

export default function LensPower({
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

  const maxFocalLengthM = cfg.maxFocalLengthM ?? 2

  const [focal, setFocal] = useState(params.focalLengthM ?? 0.4)
  const [reported, setReported] = useState(false)

  const power = useMemo(() => lensPower(focal), [focal])

  const report = useCallback(
    (nextFocal: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'LENS_POWER_COMPUTED',
          metadata: { focalLengthM: nextFocal, powerDiopters: power },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, power, onActivity],
  )

  const barWidth = Math.min(400, Math.abs(power) * 100)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 420 60" className="sim__svg" role="img" aria-label={t('power')}>
        <line x1={210} y1={30} x2={210} y2={30} className="sim__datum" />
        <rect
          x={power >= 0 ? 210 : 210 - barWidth}
          y={10}
          width={barWidth}
          height={40}
          className={power >= 0 ? 'sim__dot is-match' : 'sim__force-b'}
        />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('focal')} (m)
          <input
            type="range"
            min={-maxFocalLengthM}
            max={maxFocalLengthM}
            step={0.05}
            value={focal}
            onChange={(e) => {
              const v = Number(e.target.value)
              const clamped = v === 0 ? 0.05 : v
              setFocal(clamped)
              report(clamped)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('lensType')} value={focal > 0 ? t('convex') : t('concave')} />
        <Readout label={t('power')} value={`${num(power.toFixed(2))} D`} emphasis />
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
