import { useCallback, useMemo, useState } from 'react'
import { focalLength, imageFromMirrorFormula, type MirrorType } from '../../lib/optics/sphericalMirror'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_SPHERICAL_MIRROR — গোলীয় আয়না, চিত্র ৮.১৭–৮.২৫
 *
 * Digitises §৮.৪-৮.৬.১ (pp. 223-233): a concave/convex toggle and an
 * adjustable object distance, reproducing the book's own seven-row
 * image-nature table exactly — position, real/virtual, erect/inverted, and
 * magnified/same/diminished, for every object position it enumerates.
 */

const POLE_X = 60
const AXIS_Y = 120
const PX_PER_M = 40

interface Config {
  radiusM?: number
  maxObjectDistanceM?: number
}

interface Params {
  mirrorType?: MirrorType
  objectDistanceM?: number
}

const L = {
  title: { bn: 'গোলীয় আয়নায় প্রতিবিম্ব', en: 'Image in a Spherical Mirror' },
  concave: { bn: 'অবতল', en: 'Concave' },
  convex: { bn: 'উত্তল', en: 'Convex' },
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

export default function SphericalMirror({
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

  const radiusM = cfg.radiusM ?? 4
  const maxObjectDistanceM = cfg.maxObjectDistanceM ?? 12

  const [mirrorType, setMirrorType] = useState<MirrorType>(params.mirrorType ?? 'concave')
  const [distance, setDistance] = useState(params.objectDistanceM ?? 3)
  const [reported, setReported] = useState(false)

  const f = useMemo(() => focalLength(radiusM, mirrorType), [radiusM, mirrorType])

  const image = useMemo(() => {
    try {
      return imageFromMirrorFormula(distance, f)
    } catch {
      return null
    }
  }, [distance, f])

  const report = useCallback(
    (nextType: MirrorType, nextDistance: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'SPHERICAL_MIRROR_EXPLORED',
          metadata: { mirrorType: nextType, objectDistanceM: nextDistance },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const objX = POLE_X + Math.min(distance, maxObjectDistanceM) * PX_PER_M
  const imgX = image ? POLE_X + image.imageDistance * PX_PER_M : null

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 900 200" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={POLE_X} y1={AXIS_Y} x2={860} y2={AXIS_Y} className="sim__datum" />
        <line x1={POLE_X} y1={AXIS_Y - 80} x2={POLE_X} y2={AXIS_Y + 80} className="sim__beam" strokeWidth={4} />
        <circle
          cx={POLE_X + Math.abs(f) * PX_PER_M}
          cy={AXIS_Y}
          r={4}
          className="sim__dot is-match"
        />
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
              setMirrorType('concave')
              report('concave', distance)
            }}
            disabled={mirrorType === 'concave'}
          >
            {t('concave')}
          </button>
          <button
            type="button"
            className="is-secondary"
            onClick={() => {
              setMirrorType('convex')
              report('convex', distance)
            }}
            disabled={mirrorType === 'convex'}
          >
            {t('convex')}
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
              report(mirrorType, v)
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
