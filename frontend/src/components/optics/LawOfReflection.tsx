import { useCallback, useMemo, useState } from 'react'
import { angleOfReflection } from '../../lib/optics/lawOfReflection'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_LAW_OF_REFLECTION — প্রতিফলনের সূত্র, চিত্র ৮.০৩
 *
 * Digitises §৮.২.১ (p. 215) directly: an adjustable incident ray meets a
 * mirror surface, with the reflected ray always drawn at exactly the same
 * angle from the normal — θi = θr shown live, not just stated as a rule.
 */

const MIRROR_Y = 200
const ORIGIN_X = 200
const RAY_LEN = 160

interface Config {
  maxAngleDeg?: number
}

interface Params {
  angleOfIncidenceDeg?: number
}

const L = {
  title: { bn: 'প্রতিফলনের সূত্র', en: 'The Law of Reflection' },
  incidence: { bn: 'আপতন কোণ (θi)', en: 'Angle of incidence (θi)' },
  reflection: { bn: 'প্রতিফলন কোণ (θr)', en: 'Angle of reflection (θr)' },
  note: {
    bn: 'প্রতিফলন কোণ সব সময় আপতন কোণের সমান — লম্বের সাপেক্ষে দুই পাশে।',
    en: 'The reflection angle always equals the incidence angle — mirrored across the normal.',
  },
} as const

type LabelKey = keyof typeof L

export default function LawOfReflection({
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

  const [incidence, setIncidence] = useState(params.angleOfIncidenceDeg ?? 40)
  const [reported, setReported] = useState(false)

  const reflection = useMemo(() => angleOfReflection(incidence), [incidence])

  const report = useCallback(
    (angle: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'LAW_OF_REFLECTION_EXPLORED',
          metadata: { angleOfIncidenceDeg: angle },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const incRad = (incidence * Math.PI) / 180
  const refRad = (reflection * Math.PI) / 180
  const incX = ORIGIN_X - RAY_LEN * Math.sin(incRad)
  const incY = MIRROR_Y - RAY_LEN * Math.cos(incRad)
  const refX = ORIGIN_X + RAY_LEN * Math.sin(refRad)
  const refY = MIRROR_Y - RAY_LEN * Math.cos(refRad)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 400 260" className="sim__svg" role="img" aria-label={t('title')}>
        <defs>
          <marker id="ref-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="sim__index" />
          </marker>
        </defs>
        <line x1={40} y1={MIRROR_Y} x2={360} y2={MIRROR_Y} className="sim__beam" strokeWidth={4} />
        <line
          x1={ORIGIN_X}
          y1={MIRROR_Y - 60}
          x2={ORIGIN_X}
          y2={MIRROR_Y + 20}
          className="sim__datum"
          strokeDasharray="4 4"
        />
        <line
          x1={incX}
          y1={incY}
          x2={ORIGIN_X}
          y2={MIRROR_Y}
          className="sim__marker"
          markerEnd="url(#ref-arrow)"
        />
        <line
          x1={ORIGIN_X}
          y1={MIRROR_Y}
          x2={refX}
          y2={refY}
          className="sim__force-b"
          strokeWidth={3}
          markerEnd="url(#ref-arrow)"
        />
      </svg>

      <label className="sim__control">
        {t('incidence')}
        <input
          type="range"
          min={0}
          max={maxAngleDeg}
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
        <Readout label={t('incidence')} value={`${num(incidence)}°`} />
        <Readout label={t('reflection')} value={`${num(reflection)}°`} emphasis />
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
