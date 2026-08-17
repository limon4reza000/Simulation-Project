import { useCallback, useMemo, useState } from 'react'
import {
  fieldAroundStraightWire,
  reverseCurrent,
  type CurrentDirection,
} from '../../lib/magnetism/magneticFieldDirection'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_MAGNETIC_FIELD_DIRECTION — ডান হাতের নিয়ম, চিত্র ১২.০২–১২.০৫
 *
 * Digitises §১২.২ (pp. 331-333) as a deterministic rule engine: a current
 * direction toggle drives a live field-circulation display via the book's
 * own right-hand grip rule, the same shape as Chapter 8's
 * SIM_LAW_OF_REFLECTION.
 */

type Params = Record<string, never>

const L = {
  title: { bn: 'ডান হাতের নিয়ম', en: 'The Right-Hand Grip Rule' },
  currentDirection: { bn: 'বিদ্যুৎপ্রবাহের দিক', en: 'Current direction' },
  up: { bn: 'উপরে', en: 'Up' },
  down: { bn: 'নিচে', en: 'Down' },
  field: { bn: 'চৌম্বক ক্ষেত্রের দিক', en: 'Field circulation direction' },
  ccw: { bn: 'ঘড়ির কাঁটার বিপরীতে', en: 'Counter-clockwise' },
  cw: { bn: 'ঘড়ির কাঁটার দিকে', en: 'Clockwise' },
  reverse: { bn: 'বিদ্যুৎপ্রবাহ উল্টে দাও', en: 'Reverse the current' },
  note: {
    bn: 'ডান হাতের বুড়ো আঙুল বিদ্যুৎপ্রবাহের দিক দেখালে, বাকি আঙুলগুলো চৌম্বক ক্ষেত্রের দিক নির্দেশ করে।',
    en: "Point the right thumb along the current; the curled fingers show the field's direction.",
  },
} as const

type LabelKey = keyof typeof L

export default function MagneticFieldDirection({
  language = 'BN',
  onActivity,
}: RendererProps<Record<string, never>, Params>) {
  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )

  const [current, setCurrent] = useState<CurrentDirection>('up')
  const [reported, setReported] = useState(false)

  const field = useMemo(() => fieldAroundStraightWire(current), [current])

  const toggle = useCallback(() => {
    // Compute the next value and report it as a plain side effect, rather
    // than inside the setCurrent updater: updater functions run during
    // React's render phase, and calling another component's setState (what
    // onActivity does, up in StudentDashboard) from inside one triggers
    // "Cannot update a component while rendering a different component."
    const next = reverseCurrent(current)
    setCurrent(next)
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'MAGNETIC_FIELD_DIRECTION_EXPLORED',
        metadata: { currentDirection: next },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [current, reported, onActivity])

  const arrowY1 = current === 'up' ? 220 : 40
  const arrowY2 = current === 'up' ? 40 : 220
  const ringRotation = field === 'counterclockwise' ? 0 : 1

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 200 260" className="sim__svg" role="img" aria-label={t('title')}>
        <defs>
          <marker id="mfd-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="sim__index" />
          </marker>
        </defs>
        <ellipse cx={100} cy={130} rx={70} ry={20} className="sim__object is-weak" fill="none" strokeWidth={2} />
        <ellipse cx={100} cy={90} rx={70} ry={20} className="sim__object is-weak" fill="none" strokeWidth={2} />
        <line x1={100} y1={arrowY1} x2={100} y2={arrowY2} className="sim__marker" markerEnd="url(#mfd-arrow)" strokeWidth={4} />
        <text x={100} y={130} textAnchor="middle" className="sim__axisLabel">
          {ringRotation === 0 ? '↺' : '↻'}
        </text>
      </svg>

      <div className="sim__panel">
        <Readout label={t('currentDirection')} value={current === 'up' ? t('up') : t('down')} />
        <Readout label={t('field')} value={field === 'counterclockwise' ? t('ccw') : t('cw')} emphasis />
      </div>

      <div className="sim__practice">
        <button type="button" onClick={toggle}>
          {t('reverse')}
        </button>
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
