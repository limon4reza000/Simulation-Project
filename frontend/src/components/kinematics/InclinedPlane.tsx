import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  timeToRoll,
  averageSpeed,
  rollFraction,
  recordTrial,
  type Trial,
} from '../../lib/kinematics/inclinedPlane'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_INCLINED_PLANE — অনুসন্ধান ২.০১
 *
 * Digitises the book's own lab procedure (pp. 54–56): set a ramp height and
 * length, release a ball, time its roll, record average speed, repeat at a
 * different incline. Same shape as the Chapter 1 vernier caliper investigation
 * — a printed procedure turned interactive, not invented pedagogy.
 *
 * SVG for the usual reason: every label is Bangla, and the geometry is one
 * rotated ramp plus a ball translating along it — nothing here needs a canvas
 * redraw loop.
 */

const VIEW_W = 900
const VIEW_H = 320
const BASE_X = 100
const BASE_Y = 280
const RAMP_LEN_PX = 640

interface Config {
  maxHeightM?: number
  maxLengthM?: number
}

interface Params {
  heightM?: number
  lengthM?: number
}

const L = {
  title: { bn: 'ঢালু তলের পরীক্ষা', en: 'Inclined Plane Investigation' },
  height: { bn: 'উচ্চতা (h)', en: 'Height (h)' },
  length: { bn: 'ঢালের দৈর্ঘ্য (L)', en: 'Ramp length (L)' },
  sinTheta: { bn: 'sin θ = h/L', en: 'sin θ = h/L' },
  time: { bn: 'সময় (t)', en: 'Time (t)' },
  avgSpeed: { bn: 'গড় দ্রুতি (L/t)', en: 'Average speed (L/t)' },
  release: { bn: 'ছেড়ে দাও', en: 'Release' },
  reset: { bn: 'আবার শুরু', en: 'Reset' },
  record: { bn: 'ফলাফল যোগ করো', en: 'Add to results' },
  table: { bn: 'ফলাফল সারণি', en: 'Results table' },
  trial: { bn: 'পরীক্ষা', en: 'Trial' },
  reachedBottom: { bn: 'নিচে পৌঁছেছে', en: 'Reached the bottom' },
} as const

type LabelKey = keyof typeof L

export default function InclinedPlane({
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

  const maxHeight = cfg.maxHeightM ?? 4
  const [height, setHeight] = useState(params.heightM ?? 1.5)
  const [length] = useState(params.lengthM ?? 6)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [trials, setTrials] = useState<Trial[]>([])

  const rollTime = useMemo(() => timeToRoll(height, length), [height, length])
  const landed = elapsed >= rollTime && Number.isFinite(rollTime)

  const frameRef = useRef<number | undefined>(undefined)
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    startRef.current = performance.now() - elapsed * 1000
    const tick = (now: number) => {
      const next = (now - startRef.current) / 1000
      if (next >= rollTime) {
        setElapsed(rollTime)
        setRunning(false)
        return
      }
      setElapsed(next)
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const onRelease = useCallback(() => {
    setElapsed(0)
    setRunning(true)
  }, [])

  const onReset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
  }, [])

  const onAddTrial = useCallback(() => {
    const row = recordTrial(height, length)
    setTrials((current) => [...current, row])
    onActivity?.({
      activityType: 'INCLINED_PLANE_TRIAL_RECORDED',
      metadata: { heightM: height, lengthM: length, timeS: row.timeS },
      occurredAt: new Date().toISOString(),
    })
  }, [height, length, onActivity])

  // Ramp geometry: angle from the horizontal, derived from h and L directly
  // rather than from an approximation, so the drawn slope matches sin θ exactly.
  const angleRad = Math.asin(Math.min(1, height / length))
  const topX = BASE_X + RAMP_LEN_PX * Math.cos(angleRad)
  const topY = BASE_Y - RAMP_LEN_PX * Math.sin(angleRad)

  const fraction = rollFraction(elapsed, height, length)
  const ballX = topX + (BASE_X - topX) * fraction
  const ballY = topY + (BASE_Y - topY) * fraction

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        {/* ground */}
        <line x1={40} y1={BASE_Y} x2={860} y2={BASE_Y} className="sim__datum" />
        {/* ramp */}
        <line x1={BASE_X} y1={BASE_Y} x2={topX} y2={topY} className="sim__beam" strokeWidth={14} />
        {/* height marker */}
        <line x1={topX} y1={topY} x2={topX} y2={BASE_Y} className="sim__tick" />
        <text x={topX + 8} y={(topY + BASE_Y) / 2} className="sim__axisLabel">
          h
        </text>
        {/* ball */}
        <circle cx={ballX} cy={ballY - 12} r={12} className="sim__object" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('height')} (m)
          <input
            type="range"
            min={0.5}
            max={Math.min(maxHeight, length)}
            step={0.1}
            value={height}
            disabled={running}
            onChange={(e) => {
              setRunning(false)
              setElapsed(0)
              setHeight(Number(e.target.value))
            }}
          />
        </label>
        <Readout label={t('length')} value={`${num(length)} m`} />
        <Readout label={t('sinTheta')} value={num((height / length).toFixed(3))} />
        <Readout label={t('time')} value={`${num(Math.min(elapsed, rollTime).toFixed(2))} s`} emphasis />
        <Readout label={t('avgSpeed')} value={`${num(averageSpeed(height, length).toFixed(2))} m/s`} emphasis />
      </div>

      <div className="sim__practice">
        <button type="button" onClick={onRelease} disabled={running}>
          {t('release')}
        </button>
        <button type="button" className="is-secondary" onClick={onReset}>
          {t('reset')}
        </button>
        <button type="button" className="is-secondary" onClick={onAddTrial} disabled={running}>
          {t('record')}
        </button>
        {landed && <p className="sim__verdict is-correct">{t('reachedBottom')}</p>}
      </div>

      {trials.length > 0 && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <p className="sim__note" style={{ marginBottom: 6 }}>
            {t('table')}
          </p>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                {[t('trial'), 'h (m)', 'L (m)', 'sin θ', 't (s)', t('avgSpeed')].map((h) => (
                  <th
                    key={h}
                    style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '4px 8px' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trials.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 8px' }}>{num(i + 1)}</td>
                  <td style={{ padding: '4px 8px' }}>{num(row.heightM)}</td>
                  <td style={{ padding: '4px 8px' }}>{num(row.lengthM)}</td>
                  <td style={{ padding: '4px 8px' }}>{num(row.sinTheta.toFixed(3))}</td>
                  <td style={{ padding: '4px 8px' }}>{num(row.timeS.toFixed(2))}</td>
                  <td style={{ padding: '4px 8px' }}>{num(row.averageSpeedMs.toFixed(2))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
