import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { maxHeight, stateAtHeight } from '../../lib/energy/energyConversion'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ENERGY_CONVERSION — গতিশক্তি ও বিভব শক্তির রূপান্তর
 *
 * Digitises §৪.৩.১–৪.৩.২ (pp. 104–109): a body thrown straight up trades
 * kinetic energy for potential energy on the way up (and back on the way
 * down), their sum held fixed — exactly the relation the book derives twice,
 * once from kinematics and once from energy conservation, and calls
 * "হুবহু" (exactly) the same result either way (p. 109).
 */

const VIEW_W = 300
const VIEW_H = 420
const GROUND_Y = 380
const TOP_Y = 30
const BAR_W = 900

interface Config {
  maxLaunchSpeed?: number
}

interface Params {
  massKg?: number
  launchSpeedMs?: number
}

const L = {
  title: { bn: 'গতিশক্তি ও বিভব শক্তির রূপান্তর', en: 'Kinetic–Potential Energy Conversion' },
  mass: { bn: 'ভর (m)', en: 'Mass (m)' },
  launchSpeed: { bn: 'নিক্ষেপ বেগ (u)', en: 'Launch speed (u)' },
  height: { bn: 'উচ্চতা (h)', en: 'Height (h)' },
  speed: { bn: 'বেগ (v)', en: 'Speed (v)' },
  kinetic: { bn: 'গতিশক্তি (T)', en: 'Kinetic energy (T)' },
  potential: { bn: 'বিভব শক্তি (V)', en: 'Potential energy (V)' },
  total: { bn: 'মোট শক্তি (T + V)', en: 'Total energy (T + V)' },
  throw: { bn: 'ছুড়ে দাও', en: 'Throw' },
  reset: { bn: 'আবার শুরু', en: 'Reset' },
  note: {
    bn: 'ওঠার সময় গতিশক্তি কমে, বিভব শক্তি বাড়ে — কিন্তু মোট শক্তি সব সময় স্থির থাকে।',
    en: 'On the way up, kinetic energy falls and potential energy rises — but the total stays fixed.',
  },
} as const

type LabelKey = keyof typeof L

export default function EnergyConversion({
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

  const maxLaunchSpeed = cfg.maxLaunchSpeed ?? 30

  const [mass, setMass] = useState(params.massKg ?? 2)
  const [launchSpeed, setLaunchSpeed] = useState(params.launchSpeedMs ?? 20)
  const [elapsedFraction, setElapsedFraction] = useState(0)
  const [running, setRunning] = useState(false)
  const [reported, setReported] = useState(false)

  const peak = useMemo(() => maxHeight(launchSpeed), [launchSpeed])
  // Height follows a parabola in "flight fraction" so the bob rises then
  // falls back over one throw — fraction 0 = launch, 0.5 = peak, 1 = landing.
  const height = peak * 4 * elapsedFraction * (1 - elapsedFraction)
  const state = useMemo(
    () => stateAtHeight(mass, launchSpeed, Math.min(height, peak)),
    [mass, launchSpeed, height, peak],
  )

  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef(0)
  const FLIGHT_S = 2

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now()
    const tick = (now: number) => {
      const frac = Math.min(1, (now - startRef.current) / (FLIGHT_S * 1000))
      setElapsedFraction(frac)
      if (frac >= 1) {
        setRunning(false)
        if (!reported) {
          setReported(true)
          onActivity?.({
            activityType: 'ENERGY_CONVERSION_RUN',
            metadata: { massKg: mass, launchSpeedMs: launchSpeed, peakHeightM: peak },
            occurredAt: new Date().toISOString(),
          })
        }
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const onThrow = useCallback(() => {
    setElapsedFraction(0)
    setRunning(true)
  }, [])

  const onReset = useCallback(() => {
    setRunning(false)
    setElapsedFraction(0)
    setReported(false)
  }, [])

  const bobY = GROUND_Y - (height / (peak || 1)) * (GROUND_Y - TOP_Y)

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
        <line x1={40} y1={GROUND_Y} x2={260} y2={GROUND_Y} className="sim__datum" />
        <line x1={150} y1={TOP_Y} x2={150} y2={GROUND_Y} className="sim__datum" />
        <circle cx={150} cy={bobY} r={14} className="sim__object" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={mass}
            disabled={running}
            onChange={(e) => {
              onReset()
              setMass(Number(e.target.value))
            }}
          />
        </label>
        <label className="sim__control">
          {t('launchSpeed')} (m/s)
          <input
            type="range"
            min={1}
            max={maxLaunchSpeed}
            step={1}
            value={launchSpeed}
            disabled={running}
            onChange={(e) => {
              onReset()
              setLaunchSpeed(Number(e.target.value))
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('height')} value={`${num(state.height.toFixed(2))} m`} />
        <Readout label={t('speed')} value={`${num(state.speed.toFixed(2))} m/s`} />
        <Readout label={t('kinetic')} value={`${num(state.kinetic.toFixed(1))} J`} />
        <Readout label={t('potential')} value={`${num(state.potential.toFixed(1))} J`} />
        <Readout label={t('total')} value={`${num(state.total.toFixed(1))} J`} emphasis />
      </div>

      <svg viewBox={`0 0 ${BAR_W} 60`} className="sim__svg" role="img" aria-label="T/V bars">
        <rect x={0} y={5} width={kineticW} height={20} className="sim__object" />
        <rect x={0} y={32} width={potentialW} height={20} className="sim__object is-weak" />
      </svg>

      <div className="sim__practice">
        <button type="button" onClick={onThrow} disabled={running}>
          {t('throw')}
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
