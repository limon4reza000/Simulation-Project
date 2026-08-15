import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stateAtAngle } from '../../lib/energy/pendulumEnergy'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_PENDULUM_ENERGY — চিত্র ৪.০৪, শক্তির নিত্যতা
 *
 * Direct digitisation of the book's own printed figure (p. 114–115): a
 * swinging pendulum with live T (kinetic) / V (potential) bars. The figure
 * exists to show that T and V trade off as the bob swings but their sum —
 * drawn as the combined bar height — never changes; this renders exactly
 * that invariant instead of only stating it.
 */

const VIEW_W = 400
const VIEW_H = 340
const PIVOT_X = 200
const PIVOT_Y = 30
const STRING_LEN_PX = 240
const BAR_W = 900

interface Config {
  lengthM?: number
}

interface Params {
  massKg?: number
  amplitudeDeg?: number
}

const L = {
  title: { bn: 'দোলকের শক্তির নিত্যতা', en: "Conservation of Energy in a Pendulum" },
  mass: { bn: 'ভর (m)', en: 'Mass (m)' },
  amplitude: { bn: 'সর্বোচ্চ কোণ (θ₀)', en: 'Amplitude (θ₀)' },
  angle: { bn: 'বর্তমান কোণ (θ)', en: 'Current angle (θ)' },
  speed: { bn: 'বেগ', en: 'Speed' },
  kinetic: { bn: 'গতিশক্তি (T)', en: 'Kinetic energy (T)' },
  potential: { bn: 'স্থিতিশক্তি (V)', en: 'Potential energy (V)' },
  total: { bn: 'মোট শক্তি (T + V)', en: 'Total energy (T + V)' },
  swing: { bn: 'দোলাও', en: 'Swing' },
  reset: { bn: 'আবার শুরু', en: 'Reset' },
  note: {
    bn: 'সর্বোচ্চ কোণে T = 0, সবচেয়ে নিচে V = 0 — কিন্তু T + V সব সময় একই থাকে।',
    en: 'T = 0 at the amplitude, V = 0 at the bottom — but T + V never changes.',
  },
} as const

type LabelKey = keyof typeof L

export default function PendulumEnergy({
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

  const lengthM = cfg.lengthM ?? 1

  const [mass, setMass] = useState(params.massKg ?? 1)
  const [amplitudeDeg, setAmplitudeDeg] = useState(params.amplitudeDeg ?? 40)
  const [swinging, setSwinging] = useState(false)
  const [reported, setReported] = useState(false)
  const [angleDeg, setAngleDeg] = useState(amplitudeDeg)

  const amplitudeRad = (amplitudeDeg * Math.PI) / 180
  const angleRad = (Math.min(angleDeg, amplitudeDeg) * Math.PI) / 180

  const state = useMemo(
    () => stateAtAngle(mass, lengthM, amplitudeRad, angleRad),
    [mass, lengthM, amplitudeRad, angleRad],
  )

  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef(0)
  const PERIOD_S = 2.4

  useEffect(() => {
    if (!swinging) return
    startRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000
      const phase = (elapsed / PERIOD_S) % 1
      // Cosine sweep: starts at +amplitude, passes 0 at quarter period.
      const deg = amplitudeDeg * Math.cos(phase * 2 * Math.PI)
      setAngleDeg(deg)
      if (!reported && elapsed > PERIOD_S / 4) {
        setReported(true)
        onActivity?.({
          activityType: 'PENDULUM_ENERGY_SWUNG',
          metadata: { massKg: mass, lengthM, amplitudeDeg },
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
  }, [swinging])

  const onSwing = useCallback(() => {
    setReported(false)
    setSwinging(true)
  }, [])

  const onReset = useCallback(() => {
    setSwinging(false)
    setAngleDeg(amplitudeDeg)
  }, [amplitudeDeg])

  const bobX = PIVOT_X + STRING_LEN_PX * Math.sin(angleRad)
  const bobY = PIVOT_Y + STRING_LEN_PX * Math.cos(angleRad)

  const maxTotal = state.total || 1
  const kineticW = (state.kinetic / maxTotal) * BAR_W
  const potentialW = (state.potential / maxTotal) * BAR_W

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <line x1={PIVOT_X - 30} y1={PIVOT_Y} x2={PIVOT_X + 30} y2={PIVOT_Y} className="sim__datum" />
        <line x1={PIVOT_X} y1={PIVOT_Y} x2={bobX} y2={bobY} className="sim__beam" strokeWidth={2} />
        <circle cx={bobX} cy={bobY} r={16} className="sim__object" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('amplitude')}
          <input
            type="range"
            min={10}
            max={80}
            step={1}
            value={amplitudeDeg}
            disabled={swinging}
            onChange={(e) => {
              const v = Number(e.target.value)
              setAmplitudeDeg(v)
              setAngleDeg(v)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('angle')} value={`${num(angleDeg.toFixed(1))}°`} />
        <Readout label={t('speed')} value={`${num(state.speed.toFixed(2))} m/s`} />
        <Readout label={t('kinetic')} value={`${num(state.kinetic.toFixed(2))} J`} />
        <Readout label={t('potential')} value={`${num(state.potential.toFixed(2))} J`} />
        <Readout label={t('total')} value={`${num(state.total.toFixed(2))} J`} emphasis />
      </div>

      <svg viewBox={`0 0 ${BAR_W} 60`} className="sim__svg" role="img" aria-label="T/V bars">
        <rect x={0} y={5} width={kineticW} height={20} className="sim__object" />
        <rect x={0} y={32} width={potentialW} height={20} className="sim__object is-weak" />
      </svg>

      <div className="sim__practice">
        <button type="button" onClick={onSwing} disabled={swinging}>
          {t('swing')}
        </button>
        <button type="button" className="is-secondary" onClick={onReset}>
          {t('reset')}
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
