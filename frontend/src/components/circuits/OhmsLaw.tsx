import { useCallback, useMemo, useState } from 'react'
import { current } from '../../lib/circuits/ohmsLaw'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_OHMS_LAW — ও'মের সূত্র, চিত্র ১১.০৪
 *
 * Digitises §১১.২.১ (pp. 304-305): a battery-resistor loop with adjustable
 * voltage and resistance, live current from I = V/R, and an I-vs-V trace
 * that reproduces the book's own straight-line-through-the-origin graph.
 */

const GRAPH_X = 60
const GRAPH_Y = 20
const GRAPH_W = 200
const GRAPH_H = 160

interface Config {
  maxVoltageV?: number
  maxResistanceOhm?: number
}

interface Params {
  voltageV?: number
  resistanceOhm?: number
}

const L = {
  title: { bn: "ও'মের সূত্র", en: "Ohm's Law" },
  voltage: { bn: 'বিভব পার্থক্য (V)', en: 'Voltage (V)' },
  resistance: { bn: 'রোধ (R)', en: 'Resistance (R)' },
  current: { bn: 'বিদ্যুৎপ্রবাহ (I = V/R)', en: 'Current (I = V/R)' },
  note: {
    bn: 'নির্দিষ্ট রোধের জন্য I সবসময় V-এর সমানুপাতিক — লেখচিত্রটি মূলবিন্দুগামী সরলরেখা।',
    en: 'For a fixed resistance, I is always proportional to V — the graph is a straight line through the origin.',
  },
} as const

type LabelKey = keyof typeof L

export default function OhmsLaw({
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

  const maxVoltageV = cfg.maxVoltageV ?? 12
  const maxResistanceOhm = cfg.maxResistanceOhm ?? 20

  const [voltage, setVoltage] = useState(params.voltageV ?? 6)
  const [resistance, setResistance] = useState(params.resistanceOhm ?? 3)
  const [reported, setReported] = useState(false)

  const I = useMemo(() => current(voltage, resistance), [voltage, resistance])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'OHMS_LAW_EXPLORED',
        metadata: { voltageV: voltage, resistanceOhm: resistance, currentA: I },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, voltage, resistance, I, onActivity])

  const maxCurrent = maxVoltageV / resistance || 1
  const linePoints = [0, maxVoltageV]
    .map((v) => {
      const x = GRAPH_X + (v / maxVoltageV) * GRAPH_W
      const y = GRAPH_Y + GRAPH_H - ((v / resistance) / maxCurrent) * GRAPH_H
      return `${x},${y}`
    })
    .join(' ')
  const dotX = GRAPH_X + (voltage / maxVoltageV) * GRAPH_W
  const dotY = GRAPH_Y + GRAPH_H - (I / maxCurrent) * GRAPH_H

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 320 200" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={GRAPH_X} y1={GRAPH_Y + GRAPH_H} x2={GRAPH_X + GRAPH_W} y2={GRAPH_Y + GRAPH_H} className="sim__datum" />
        <line x1={GRAPH_X} y1={GRAPH_Y} x2={GRAPH_X} y2={GRAPH_Y + GRAPH_H} className="sim__datum" />
        <polyline points={linePoints} className="sim__curve" fill="none" />
        <circle cx={dotX} cy={dotY} r={5} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('voltage')} (V)
          <input
            type="range"
            min={0}
            max={maxVoltageV}
            step={0.5}
            value={voltage}
            onChange={(e) => {
              setVoltage(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('resistance')} (Ω)
          <input
            type="range"
            min={1}
            max={maxResistanceOhm}
            step={0.5}
            value={resistance}
            onChange={(e) => {
              setResistance(Number(e.target.value))
              report()
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('current')} value={`${num(I.toFixed(2))} A`} emphasis />
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
