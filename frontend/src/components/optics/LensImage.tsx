import { useCallback, useMemo, useState } from 'react'
import { lensImage, lensFocalLength, type LensType } from '../../lib/optics/lensImage'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_LENS_IMAGE — লেন্সে প্রতিবিম্ব, চিত্র ৯.১৮–৯.২৬
 *
 * Digitises §৯.৪.১-৯.৪.২ (pp. 257-264): a convex/concave toggle and
 * adjustable object distance, reproducing the book's own ray-constructed
 * image results — concave always virtual/erect/diminished, convex's full
 * five-case behaviour by object position relative to f and 2f.
 */

const POLE_X = 220
const AXIS_Y = 120
const PX_PER_M = 30

interface Config {
  focalLengthMagnitudeM?: number
  maxObjectDistanceM?: number
}

interface Params {
  lensType?: LensType
  objectDistanceM?: number
}

const L = {
  title: { bn: 'লেন্সে প্রতিবিম্ব', en: 'Image in a Lens' },
  convex: { bn: 'উত্তল', en: 'Convex' },
  concave: { bn: 'অবতল', en: 'Concave' },
  distance: { bn: 'বস্তুর দূরত্ব (u)', en: 'Object distance (u)' },
  imagePos: { bn: 'প্রতিবিম্বের দূরত্ব (v)', en: 'Image distance (v)' },
  nature: { bn: 'প্রকৃতি', en: 'Nature' },
  real: { bn: 'বাস্তব', en: 'Real' },
  virtual: { bn: 'অবাস্তব', en: 'Virtual' },
  erect: { bn: 'সোজা', en: 'Erect' },
  inverted: { bn: 'উল্টো', en: 'Inverted' },
  magnified: { bn: 'বিবর্ধিত', en: 'Magnified' },
  same: { bn: 'সমান', en: 'Same size' },
  diminished: { bn: 'খর্বিত', en: 'Diminished' },
  noImage: { bn: 'ফোকাস বিন্দুতে কোনো প্রতিবিম্ব গঠিত হয় না', en: 'No image forms with the object at the focus' },
} as const

type LabelKey = keyof typeof L

export default function LensImage({
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

  const focalMagnitude = cfg.focalLengthMagnitudeM ?? 2
  const maxObjectDistanceM = cfg.maxObjectDistanceM ?? 12

  const [lensType, setLensType] = useState<LensType>(params.lensType ?? 'convex')
  const [distance, setDistance] = useState(params.objectDistanceM ?? 5)
  const [reported, setReported] = useState(false)

  const f = useMemo(() => lensFocalLength(focalMagnitude, lensType), [focalMagnitude, lensType])

  const image = useMemo(() => {
    try {
      return lensImage(distance, f)
    } catch {
      return null
    }
  }, [distance, f])

  const report = useCallback(
    (nextType: LensType, nextDistance: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'LENS_IMAGE_EXPLORED',
          metadata: { lensType: nextType, objectDistanceM: nextDistance },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const objX = POLE_X - Math.min(distance, maxObjectDistanceM) * PX_PER_M
  const imgX = image ? POLE_X + image.imageDistance * PX_PER_M : null

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 500 200" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={30} y1={AXIS_Y} x2={470} y2={AXIS_Y} className="sim__datum" />
        <line x1={POLE_X} y1={AXIS_Y - 80} x2={POLE_X} y2={AXIS_Y + 80} className="sim__beam" strokeWidth={4} />
        <circle cx={POLE_X - Math.abs(f) * PX_PER_M} cy={AXIS_Y} r={4} className="sim__dot is-match" />
        <circle cx={POLE_X + Math.abs(f) * PX_PER_M} cy={AXIS_Y} r={4} className="sim__dot is-match" />
        <circle cx={objX} cy={AXIS_Y - 30} r={9} className="sim__object" />
        {imgX !== null && (
          <circle
            cx={imgX}
            cy={image!.real ? AXIS_Y + 30 : AXIS_Y - 30}
            r={9 * Math.min(3, Math.max(0.3, image!.magnification))}
            className={image!.real ? 'sim__dot is-match' : 'sim__object is-weak'}
          />
        )}
      </svg>

      <div className="sim__panel">
        <div className="sim__practice">
          <button
            type="button"
            onClick={() => {
              setLensType('convex')
              report('convex', distance)
            }}
            disabled={lensType === 'convex'}
          >
            {t('convex')}
          </button>
          <button
            type="button"
            className="is-secondary"
            onClick={() => {
              setLensType('concave')
              report('concave', distance)
            }}
            disabled={lensType === 'concave'}
          >
            {t('concave')}
          </button>
        </div>
        <label className="sim__control">
          {t('distance')} (m)
          <input
            type="range"
            min={0.1}
            max={maxObjectDistanceM}
            step={0.1}
            value={distance}
            onChange={(e) => {
              const v = Number(e.target.value)
              setDistance(v)
              report(lensType, v)
            }}
          />
        </label>
      </div>

      {image ? (
        <div className="sim__panel">
          <Readout label={t('imagePos')} value={`${num(Math.abs(image.imageDistance).toFixed(2))} m`} />
          <Readout label={t('nature')} value={image.real ? t('real') : t('virtual')} emphasis />
          <Readout label="" value={image.erect ? t('erect') : t('inverted')} />
          <Readout
            label=""
            value={
              image.sizeRelation === 'magnified'
                ? t('magnified')
                : image.sizeRelation === 'same'
                  ? t('same')
                  : t('diminished')
            }
          />
        </div>
      ) : (
        <p className="sim__note">{t('noImage')}</p>
      )}
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
