import { useCallback, useMemo, useState } from 'react'
import { imageFromMirrorFormula } from '../../lib/optics/sphericalMirror'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_MIRROR_FORMULA — 1/u + 1/v = 1/f ও বিবর্ধন, §৮.৭
 *
 * Digitises the mirror formula and magnification together (p. 233-234) as a
 * direct numeric calculator: enter an object distance and a signed focal
 * length (positive for concave, negative for convex), get the image
 * distance and magnification straight from the formula — the algebraic
 * companion to SIM_SPHERICAL_MIRROR's own ray-construction view of exactly
 * the same relation.
 */

interface Config {
  maxObjectDistanceM?: number
  maxFocalLengthM?: number
}

interface Params {
  objectDistanceM?: number
  focalLengthM?: number
}

const L = {
  title: { bn: 'দর্পণ সূত্র ও বিবর্ধন', en: 'Mirror Formula and Magnification' },
  distance: { bn: 'বস্তুর দূরত্ব (u)', en: 'Object distance (u)' },
  focal: { bn: 'ফোকাস দূরত্ব (f) — অবতলের জন্য ধনাত্মক, উত্তলের জন্য ঋণাত্মক', en: 'Focal length (f) — positive for concave, negative for convex' },
  imageDist: { bn: 'প্রতিবিম্বের দূরত্ব (v)', en: 'Image distance (v)' },
  magnification: { bn: 'বিবর্ধন (m = v/u)', en: 'Magnification (m = v/u)' },
  nature: { bn: 'প্রকৃতি', en: 'Nature' },
  real: { bn: 'বাস্তব', en: 'Real' },
  virtual: { bn: 'অবাস্তব', en: 'Virtual' },
  noImage: { bn: 'এই অবস্থানে কোনো প্রতিবিম্ব গঠিত হয় না (রশ্মিগুলো সমান্তরাল থাকে)', en: 'No image forms at this position (the rays stay parallel)' },
  note: {
    bn: '১/u + ১/v = ১/f — একই সূত্র উভয় ধরনের আয়নার জন্য প্রযোজ্য, শুধু f-এর চিহ্ন ভিন্ন।',
    en: '1/u + 1/v = 1/f — the same formula applies to both mirror types; only the sign of f differs.',
  },
} as const

type LabelKey = keyof typeof L

export default function MirrorFormula({
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

  const maxObjectDistanceM = cfg.maxObjectDistanceM ?? 20
  const maxFocalLengthM = cfg.maxFocalLengthM ?? 10

  const [distance, setDistance] = useState(params.objectDistanceM ?? 6)
  const [focal, setFocal] = useState(params.focalLengthM ?? 2)
  const [reported, setReported] = useState(false)

  const image = useMemo(() => {
    try {
      return imageFromMirrorFormula(distance, focal)
    } catch {
      return null
    }
  }, [distance, focal])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'MIRROR_FORMULA_COMPUTED',
        metadata: { objectDistanceM: distance, focalLengthM: focal },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, distance, focal, onActivity])

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <div className="sim__panel">
        <label className="sim__control">
          {t('distance')} (m)
          <input
            type="range"
            min={0.1}
            max={maxObjectDistanceM}
            step={0.1}
            value={distance}
            onChange={(e) => {
              setDistance(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('focal')} (m)
          <input
            type="range"
            min={-maxFocalLengthM}
            max={maxFocalLengthM}
            step={0.1}
            value={focal}
            onChange={(e) => {
              const v = Number(e.target.value)
              setFocal(v === 0 ? 0.1 : v)
              report()
            }}
          />
        </label>
      </div>

      {image ? (
        <div className="sim__panel">
          <Readout label={t('imageDist')} value={`${num(Math.abs(image.imageDistance).toFixed(2))} m`} emphasis />
          <Readout label={t('magnification')} value={num(image.magnification.toFixed(2))} />
          <Readout label={t('nature')} value={image.real ? t('real') : t('virtual')} />
        </div>
      ) : (
        <p className="sim__note">{t('noImage')}</p>
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
