import { useCallback, useEffect, useRef, useState } from 'react'
import {
  staysStill,
  slideAcceleration,
  staticCoefficientFromAngle,
} from '../../lib/dynamics/frictionIncline'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_FRICTION_INCLINE — চিত্র ৩.১৮, স্থিতি ঘর্ষণ সহগ পরিমাপ
 *
 * Digitises the book's own tilt-table investigation (p. 91): raise one end of
 * a surface with a block on it until the block just starts to slide, and read
 * μs = tan θc off that critical angle. Deliberately the same interaction shape
 * as Chapter 2's `SIM_INCLINED_PLANE` — a ramp raised by a slider, a block on
 * it — reused rather than reinvented for new physics, which is itself a small
 * piece of evidence for the registry's extensibility claim.
 */

const VIEW_W = 900
const VIEW_H = 300
const BASE_X = 100
const BASE_Y = 260
const RAMP_LEN_PX = 620

interface Config {
  staticCoefficient?: number
  kineticCoefficient?: number
}

type Params = Record<string, never>

const L = {
  title: { bn: 'স্থিতি ঘর্ষণ সহগ পরিমাপ', en: 'Measuring the Coefficient of Static Friction' },
  angle: { bn: 'ঢালের কোণ (θ)', en: 'Incline angle (θ)' },
  status: { bn: 'অবস্থা', en: 'Status' },
  holding: { bn: 'স্থির আছে', en: 'Holding still' },
  sliding: { bn: 'পিছলে যাচ্ছে!', en: 'Sliding!' },
  criticalAngle: { bn: 'সংকট কোণ (θc)', en: 'Critical angle (θc)' },
  measuredMu: { bn: 'পরিমাপকৃত μs = tan θc', en: 'Measured μs = tan θc' },
  note: {
    bn: 'ঢাল বাড়াতে থাকো যতক্ষণ না ব্লকটি ঠিক পিছলাতে শুরু করে — সেই কোণেই tan θc = μs।',
    en: 'Keep raising the incline until the block just starts to slide — at that exact angle, tan θc = μs.',
  },
} as const

type LabelKey = keyof typeof L

export default function FrictionIncline({
  config,
  language = 'BN',
  onActivity,
}: RendererProps<Config, Params>) {
  const cfg = (config ?? {}) as Config
  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (v: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(v), 'BN') : String(v),
    [language],
  )

  // Hidden from the student, exactly as in the real investigation: μs is what
  // is being measured, not a given. The book's own value is not printed, so
  // this is a reasonable, unremarkable value for wood-on-wood — documented as
  // such rather than attributed to a page that does not state it.
  const staticMu = cfg.staticCoefficient ?? 0.4
  const kineticMu = cfg.kineticCoefficient ?? 0.3

  const [angleDeg, setAngleDeg] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [slideProgress, setSlideProgress] = useState(0)
  const [reportedSlide, setReportedSlide] = useState(false)

  const angleRad = (angleDeg * Math.PI) / 180
  const holding = staysStill(angleRad, staticMu)

  useEffect(() => {
    setSliding(!holding)
    if (holding) setSlideProgress(0)
  }, [holding])

  const frameRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!sliding) return
    const a = slideAcceleration(angleRad, kineticMu)
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setSlideProgress((p) => Math.min(1, p + a * dt * 0.15))
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliding])

  useEffect(() => {
    if (sliding && !reportedSlide) {
      setReportedSlide(true)
      onActivity?.({
        activityType: 'FRICTION_INCLINE_SLID',
        metadata: {
          angleDeg: Math.round(angleDeg),
          measuredMu: staticCoefficientFromAngle(angleRad),
        },
        occurredAt: new Date().toISOString(),
      })
    }
    if (holding) setReportedSlide(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliding])

  const topX = BASE_X + RAMP_LEN_PX * Math.cos(angleRad)
  const topY = BASE_Y - RAMP_LEN_PX * Math.sin(angleRad)
  const blockFrac = 0.12 + slideProgress * 0.8
  const blockX = topX + (BASE_X - topX) * blockFrac
  const blockY = topY + (BASE_Y - topY) * blockFrac

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <line x1={40} y1={BASE_Y} x2={860} y2={BASE_Y} className="sim__datum" />
        <line x1={BASE_X} y1={BASE_Y} x2={topX} y2={topY} className="sim__beam" strokeWidth={14} />
        <circle
          cx={blockX}
          cy={blockY - 14}
          r={14}
          className={sliding ? 'sim__dot is-match' : 'sim__object'}
        />
      </svg>

      <label className="sim__control">
        {t('angle')}
        <input
          type="range"
          min={0}
          max={80}
          step={1}
          value={angleDeg}
          onChange={(e) => setAngleDeg(Number(e.target.value))}
        />
      </label>

      <div className="sim__panel">
        <Readout
          label={t('status')}
          value={holding ? t('holding') : t('sliding')}
          emphasis={sliding}
        />
        <Readout label={t('angle')} value={`${num(angleDeg)}°`} />
        {sliding && (
          <>
            <Readout
              label={t('criticalAngle')}
              value={`${num(angleDeg)}°`}
            />
            <Readout
              label={t('measuredMu')}
              value={num(staticCoefficientFromAngle(angleRad).toFixed(3))}
              emphasis
            />
          </>
        )}
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
