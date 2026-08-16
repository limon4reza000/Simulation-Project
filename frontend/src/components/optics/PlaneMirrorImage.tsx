import { useCallback, useMemo, useState } from 'react'
import { imageDistance, minimumMirrorLength } from '../../lib/optics/planeMirror'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_PLANE_MIRROR_IMAGE — প্রতিবিম্ব, চিত্র ৮.০৮–৮.১২
 *
 * Digitises §৮.৩.১ (pp. 219-223): an object at an adjustable distance from a
 * plane mirror, its virtual image drawn at the same distance behind it, plus
 * the book's own full-length-mirror result — a viewer needs a mirror only
 * half their own height, independent of how far they stand from it.
 */

const MIRROR_X = 200
const PX_PER_M = 40

interface Config {
  maxDistanceM?: number
  maxHeightM?: number
}

interface Params {
  objectDistanceM?: number
  viewerHeightM?: number
}

const L = {
  title: { bn: 'সমতল আয়নায় প্রতিবিম্ব', en: 'Image in a Plane Mirror' },
  distance: { bn: 'বস্তুর দূরত্ব', en: 'Object distance' },
  imageDistanceLabel: { bn: 'প্রতিবিম্বের দূরত্ব', en: 'Image distance' },
  viewerHeight: { bn: 'দর্শকের উচ্চতা', en: "Viewer's height" },
  mirrorLength: { bn: 'প্রয়োজনীয় আয়নার দৈর্ঘ্য', en: 'Mirror length needed' },
  note: {
    bn: 'পূর্ণদৈর্ঘ্য প্রতিবিম্ব দেখতে আয়নার দৈর্ঘ্য দর্শকের উচ্চতার অর্ধেক হলেই যথেষ্ট — আয়না থেকে দূরত্ব যাই হোক না কেন।',
    en: 'A mirror only half the viewer\'s height is enough for a full-length reflection — regardless of how far they stand from it.',
  },
} as const

type LabelKey = keyof typeof L

export default function PlaneMirrorImage({
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

  const maxDistanceM = cfg.maxDistanceM ?? 5
  const maxHeightM = cfg.maxHeightM ?? 2.2

  const [distance, setDistance] = useState(params.objectDistanceM ?? 2)
  const [height, setHeight] = useState(params.viewerHeightM ?? 1.5)
  const [reported, setReported] = useState(false)

  const imgDist = useMemo(() => imageDistance(distance), [distance])
  const mirrorLen = useMemo(() => minimumMirrorLength(height), [height])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'PLANE_MIRROR_IMAGE_EXPLORED',
        metadata: { objectDistanceM: distance, viewerHeightM: height },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, distance, height, onActivity])

  const objX = MIRROR_X - Math.min(distance, maxDistanceM) * PX_PER_M
  const imgX = MIRROR_X + Math.min(imgDist, maxDistanceM) * PX_PER_M

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 500 160" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={MIRROR_X} y1={10} x2={MIRROR_X} y2={140} className="sim__beam" strokeWidth={6} />
        <circle cx={objX} cy={100} r={10} className="sim__object" />
        <circle cx={imgX} cy={100} r={10} className="sim__dot is-match" />
        <line x1={objX} y1={100} x2={imgX} y2={100} className="sim__datum" strokeDasharray="3 3" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('distance')} (m)
          <input
            type="range"
            min={0.2}
            max={maxDistanceM}
            step={0.1}
            value={distance}
            onChange={(e) => {
              setDistance(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('viewerHeight')} (m)
          <input
            type="range"
            min={0.5}
            max={maxHeightM}
            step={0.05}
            value={height}
            onChange={(e) => {
              setHeight(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('imageDistanceLabel')} value={`${num(imgDist.toFixed(1))} m`} />
        <Readout label={t('mirrorLength')} value={`${num(mirrorLen.toFixed(2))} m`} emphasis />
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
