import { useCallback, useMemo, useState } from 'react'
import { workAgainstFriction } from '../../lib/energy/work'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_WORK — কাজ, চিত্র ৪.১
 *
 * Digitises §৪.১ (pp. 100–103): a force pulls a block across a surface
 * against friction. Both forces act over the same displacement, so both do
 * work over it — the applied force positively, friction negatively. The
 * sign is shown explicitly rather than only a magnitude, since the book's
 * own point (p. 103) is that "negative work" is not a null result but a
 * force taking energy away.
 */

const VIEW_W = 900
const VIEW_H = 240
const TRACK_Y = 150
const TRACK_LEFT = 80
const TRACK_RIGHT = 780

interface Config {
  maxForce?: number
  maxFriction?: number
  maxDisplacement?: number
}

interface Params {
  forceN?: number
  frictionN?: number
  displacementM?: number
}

const L = {
  title: { bn: 'কাজ', en: 'Work' },
  force: { bn: 'বল (F)', en: 'Force (F)' },
  friction: { bn: 'ঘর্ষণ বল (f)', en: 'Friction (f)' },
  displacement: { bn: 'সরণ (s)', en: 'Displacement (s)' },
  appliedWork: { bn: 'প্রযুক্ত বলের কাজ', en: 'Work by applied force' },
  frictionWork: { bn: 'ঘর্ষণ বলের কাজ', en: 'Work by friction' },
  netWork: { bn: 'নিট কাজ', en: 'Net work' },
  note: {
    bn: 'প্রযুক্ত বল সরণের দিকে কাজ করে (ধনাত্মক), ঘর্ষণ বল বিপরীত দিকে কাজ করে (ঋণাত্মক)।',
    en: 'The applied force does positive work along the displacement; friction does negative work against it.',
  },
} as const

type LabelKey = keyof typeof L

export default function Work({
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

  const maxForce = cfg.maxForce ?? 200
  const maxFriction = cfg.maxFriction ?? 50
  const maxDisplacement = cfg.maxDisplacement ?? 20

  const [force, setForce] = useState(params.forceN ?? 100)
  const [friction, setFriction] = useState(params.frictionN ?? 10)
  const [displacement, setDisplacement] = useState(params.displacementM ?? 10)
  const [reported, setReported] = useState(false)

  const result = useMemo(
    () => workAgainstFriction(force, friction, displacement),
    [force, friction, displacement],
  )

  const reportPull = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'WORK_COMPUTED',
        metadata: {
          forceN: force,
          frictionN: friction,
          displacementM: displacement,
          netWork: result.netWork,
        },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, force, friction, displacement, result.netWork, onActivity])

  const fraction = displacement / maxDisplacement
  const blockX = TRACK_LEFT + Math.min(1, fraction) * (TRACK_RIGHT - TRACK_LEFT - 40)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <defs>
          <marker id="work-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="sim__index" />
          </marker>
        </defs>
        <line x1={40} y1={TRACK_Y} x2={860} y2={TRACK_Y} className="sim__datum" />
        <rect x={blockX} y={TRACK_Y - 44} width={40} height={40} className="sim__object" rx={4} />

        {force > 0 && (
          <line
            x1={blockX - 4}
            y1={TRACK_Y - 24}
            x2={blockX + 46}
            y2={TRACK_Y - 24}
            className="sim__marker"
            markerEnd="url(#work-arrow)"
          />
        )}
        {friction > 0 && (
          <line
            x1={blockX + 44}
            y1={TRACK_Y - 10}
            x2={blockX - 6}
            y2={TRACK_Y - 10}
            className="sim__force-b"
            strokeWidth={3}
            markerEnd="url(#work-arrow)"
          />
        )}
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('force')} (N)
          <input
            type="range"
            min={0}
            max={maxForce}
            step={5}
            value={force}
            onChange={(e) => setForce(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('friction')} (N)
          <input
            type="range"
            min={0}
            max={maxFriction}
            step={1}
            value={friction}
            onChange={(e) => setFriction(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('displacement')} (m)
          <input
            type="range"
            min={0}
            max={maxDisplacement}
            step={0.5}
            value={displacement}
            onChange={(e) => {
              setDisplacement(Number(e.target.value))
              reportPull()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('appliedWork')} value={`${num(result.appliedWork.toFixed(1))} J`} />
        <Readout label={t('frictionWork')} value={`${num(result.frictionWork.toFixed(1))} J`} />
        <Readout label={t('netWork')} value={`${num(result.netWork.toFixed(1))} J`} emphasis />
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
