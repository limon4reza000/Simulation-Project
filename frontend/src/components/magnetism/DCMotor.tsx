import { useCallback, useEffect, useRef, useState } from 'react'
import { advanceAngle, isDeadPoint } from '../../lib/magnetism/dcMotor'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_DC_MOTOR — ডিসি মোটর, চিত্র ১২.০৯–১২.১১
 *
 * Digitises §১২.২.৩-১২.২.৪ (pp. 335-338) as a rule engine: a coil in a
 * magnetic field turns continuously toward alignment, and a commutator
 * (modelled as continuing rotation through the dead points) is what keeps
 * it turning past the angles where torque would otherwise vanish.
 */

const PIVOT_X = 150
const PIVOT_Y = 90
const HALF_LEN = 55

interface Config {
  degreesPerSecond?: number
}

type Params = Record<string, never>

const L = {
  title: { bn: 'ডিসি মোটর', en: 'DC Motor' },
  angle: { bn: 'কোণ', en: 'Angle' },
  torque: { bn: 'টর্ক', en: 'Torque' },
  spinning: { bn: 'ঘুরছে', en: 'Toward alignment' },
  deadPoint: { bn: 'মৃত বিন্দু — কম্যুটেটর না থাকলে থেমে যেত', en: 'Dead point — would stop here without the commutator' },
  spin: { bn: 'ঘোরাও', en: 'Spin' },
  stop: { bn: 'থামাও', en: 'Stop' },
  note: {
    bn: 'কয়েল সারিবদ্ধ অবস্থানে পৌঁছালে টর্ক শূন্য হয়ে যায় — কম্যুটেটর তখনই বিদ্যুৎপ্রবাহের দিক উল্টে দেয় বলে কয়েলটি সেখানে না থেমে ঘুরতেই থাকে।',
    en: 'Torque vanishes right at alignment — the commutator reverses the current at exactly that instant, so the coil keeps turning instead of stopping there.',
  },
} as const

type LabelKey = keyof typeof L

export default function DCMotor({
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

  const degreesPerSecond = cfg.degreesPerSecond ?? 90

  const [angle, setAngle] = useState(30)
  const [spinning, setSpinning] = useState(false)
  const [passedDeadPoint, setPassedDeadPoint] = useState(false)

  const frameRef = useRef<number | undefined>(undefined)
  const lastRef = useRef(0)
  const angleRef = useRef(angle)
  angleRef.current = angle

  useEffect(() => {
    if (!spinning) return
    lastRef.current = performance.now()
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      // Read/advance via a ref rather than setAngle's own updater: the
      // updater runs during React's render phase, and calling another
      // component's setState from inside one (what onActivity does, up in
      // StudentDashboard) triggers "Cannot update a component while
      // rendering a different component" — the same bug fixed in
      // MagneticFieldDirection.tsx.
      const prev = angleRef.current
      const next = advanceAngle(prev, degreesPerSecond * dt)
      angleRef.current = next
      setAngle(next)
      if (next < prev) {
        setPassedDeadPoint(true)
        onActivity?.({
          activityType: 'DC_MOTOR_PASSED_DEAD_POINT',
          metadata: { angleDeg: prev },
          occurredAt: new Date().toISOString(),
        })
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, degreesPerSecond])

  const dead = isDeadPoint(Math.round(angle))
  const angleRad = (angle * Math.PI) / 180
  const x1 = PIVOT_X - HALF_LEN * Math.cos(angleRad)
  const y1 = PIVOT_Y - HALF_LEN * Math.sin(angleRad)
  const x2 = PIVOT_X + HALF_LEN * Math.cos(angleRad)
  const y2 = PIVOT_Y + HALF_LEN * Math.sin(angleRad)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 300 180" className="sim__svg" role="img" aria-label={t('title')}>
        <rect x={10} y={30} width={40} height={120} className="sim__object is-weak" />
        <rect x={250} y={30} width={40} height={120} className="sim__object is-weak" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="sim__beam" strokeWidth={6} />
        <circle cx={PIVOT_X} cy={PIVOT_Y} r={5} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <Readout label={t('angle')} value={`${num(angle.toFixed(0))}°`} />
        <Readout
          label={t('torque')}
          value={dead ? t('deadPoint') : t('spinning')}
          emphasis={dead}
        />
      </div>

      <div className="sim__practice">
        <button type="button" onClick={() => setSpinning(true)} disabled={spinning}>
          {t('spin')}
        </button>
        <button type="button" className="is-secondary" onClick={() => setSpinning(false)}>
          {t('stop')}
        </button>
      </div>

      <p className="sim__note">{t('note')}</p>
      {passedDeadPoint && <p className="sim__note">{t('deadPoint')}</p>}
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
