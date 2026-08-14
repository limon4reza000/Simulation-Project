import { useCallback, useMemo, useRef, useState } from 'react'
import {
  readScrewGauge,
  leastCount,
  thimbleAngle,
  checkScrewGaugeAnswer,
  type ScrewGaugeConfig,
} from '../../lib/instruments/screwGauge'
import { useSvgDrag } from '../../lib/useSvgDrag'
import { toBanglaDigits } from './VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_SCREW_GAUGE — স্ক্রু-গেইজ
 *
 * Digitises book p. 22: pitch 1 mm per full rotation, 100 circular divisions,
 * least count 0.01 mm.
 *
 * This component is deliberately the same shape as VernierCaliper — drag,
 * quantise, read, verify — differing only in geometry and in reading a rotation
 * rather than a translation. That similarity is the architectural claim of the
 * project made concrete: the second instrument reuses the pure-logic pattern,
 * the drag hook, the readout components and the registry contract wholesale.
 */

const VIEW_W = 900
const VIEW_H = 320
const SLEEVE_X = 250
const SLEEVE_Y = 150
const PX_PER_MM = 26
const DIAL_CX = 700
const DIAL_CY = 150
const DIAL_R = 96
const MAX_MM = 12

interface Config {
  maxLengthMm?: number
}

interface Params {
  pitch?: number
  circularDivisions?: number
  objectLength?: number
  mode?: 'explore' | 'practice'
}

const L = {
  title: { bn: 'স্ক্রু-গেইজ', en: 'Screw Gauge' },
  linear: { bn: 'রৈখিক স্কেল পাঠ', en: 'Linear scale reading' },
  circular: { bn: 'বৃত্তাকার স্কেল পাঠ', en: 'Circular scale reading' },
  least: { bn: 'নূন্যাঙ্ক', en: 'Least count' },
  reading: { bn: 'পাঠ', en: 'Reading' },
  rotate: { bn: 'থিম্বল ঘুরাও', en: 'Rotate the thimble' },
  pitch: { bn: 'পিচ', en: 'Pitch' },
  yourAnswer: { bn: 'তোমার পাঠ (mm)', en: 'Your reading (mm)' },
  check: { bn: 'মিলিয়ে দেখো', en: 'Check' },
  next: { bn: 'নতুন পরিমাপ', en: 'New measurement' },
  correct: { bn: 'সঠিক হয়েছে!', en: 'Correct!' },
  wrong: { bn: 'আবার চেষ্টা করো', en: 'Try again' },
} as const

type LabelKey = keyof typeof L

export default function ScrewGauge({
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

  const gaugeConfig: ScrewGaugeConfig = useMemo(
    () => ({
      pitch: params.pitch ?? 1,
      circularDivisions: params.circularDivisions ?? 100,
    }),
    [params.pitch, params.circularDivisions],
  )

  const maxMm = Math.min(cfg.maxLengthMm ?? MAX_MM, MAX_MM)
  const practice = params.mode === 'practice'

  const [length, setLength] = useState(() =>
    practice ? randomLength(maxMm, gaugeConfig) : (params.objectLength ?? 2.53),
  )
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<'correct' | 'wrong' | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const previousAngle = useRef<number | null>(null)

  /** Angle of a point about the dial centre, in degrees clockwise from 12. */
  const angleAt = useCallback(({ x, y }: { x: number; y: number }) => {
    return (Math.atan2(x - DIAL_CX, DIAL_CY - y) * 180) / Math.PI
  }, [])

  const onStart = useCallback(
    (point: { x: number; y: number }) => {
      previousAngle.current = angleAt(point)
    },
    [angleAt],
  )

  const onMove = useCallback(
    (point: { x: number; y: number }) => {
      const current = angleAt(point)
      const previous = previousAngle.current
      previousAngle.current = current
      if (previous === null) return

      // Normalise the step into (-180, 180] so crossing 12 o'clock does not
      // register as a near-full turn in the opposite direction.
      let delta = current - previous
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360

      setLength((value) => {
        const next = value + (delta / 360) * gaugeConfig.pitch
        return Math.max(0, Math.min(maxMm, Math.round(next * 1000) / 1000))
      })
    },
    [angleAt, gaugeConfig.pitch, maxMm],
  )

  const onEnd = useCallback(() => {
    previousAngle.current = null
  }, [])

  const viewBox = useMemo(() => ({ width: VIEW_W, height: VIEW_H }), [])
  const { dragging, handlers } = useSvgDrag(svgRef, viewBox, {
    onStart,
    onMove,
    onEnd,
  })

  const result = useMemo(
    () => readScrewGauge(length, gaugeConfig),
    [length, gaugeConfig],
  )
  const angle = thimbleAngle(length, gaugeConfig)
  const divisions = gaugeConfig.circularDivisions

  const onCheck = useCallback(() => {
    const submitted = Number.parseFloat(answer)
    if (Number.isNaN(submitted)) return
    const check = checkScrewGaugeAnswer(submitted, length, gaugeConfig)
    setVerdict(check.correct ? 'correct' : 'wrong')
    onActivity?.({
      activityType: 'SCREW_GAUGE_ANSWER_SUBMITTED',
      metadata: { correct: check.correct },
      occurredAt: new Date().toISOString(),
    })
  }, [answer, length, gaugeConfig, onActivity])

  const onNext = useCallback(() => {
    setLength(randomLength(maxMm, gaugeConfig))
    setAnswer('')
    setVerdict(null)
  }, [maxMm, gaugeConfig])

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        {/* U-frame and anvil */}
        <path
          d={`M 150 60 Q 60 60 60 150 Q 60 240 150 240
              L 150 210 Q 100 210 100 150 Q 100 90 150 90 Z`}
          className="sim__frame"
        />
        <rect x={150} y={132} width={22} height={36} className="sim__jaw" />

        {/* spindle: gap between anvil and spindle face is the measured length */}
        <rect
          x={172 + length * PX_PER_MM}
          y={138}
          width={SLEEVE_X - (172 + length * PX_PER_MM)}
          height={24}
          className="sim__spindle"
        />
        {length > 0 && (
          <rect
            x={172}
            y={132}
            width={length * PX_PER_MM}
            height={36}
            className="sim__object"
            rx={2}
          />
        )}

        {/* sleeve with the linear (pitch) scale */}
        <rect
          x={SLEEVE_X}
          y={SLEEVE_Y - 22}
          width={300}
          height={44}
          className="sim__beam"
          rx={4}
        />
        <line
          x1={SLEEVE_X}
          y1={SLEEVE_Y}
          x2={SLEEVE_X + 300}
          y2={SLEEVE_Y}
          className="sim__datum"
        />
        {Array.from({ length: maxMm + 1 }, (_, mm) => (
          <g key={`lin${mm}`}>
            <line
              x1={SLEEVE_X + 10 + mm * 22}
              y1={SLEEVE_Y}
              x2={SLEEVE_X + 10 + mm * 22}
              y2={SLEEVE_Y - (mm % 5 === 0 ? 16 : 9)}
              className={`sim__tick ${mm <= result.linearScale ? 'is-passed' : ''}`}
            />
            {mm % 5 === 0 && (
              <text
                x={SLEEVE_X + 10 + mm * 22}
                y={SLEEVE_Y - 22}
                className="sim__tickLabel"
                textAnchor="middle"
              >
                {toBanglaDigits(mm, language)}
              </text>
            )}
          </g>
        ))}
        <text x={SLEEVE_X} y={SLEEVE_Y + 44} className="sim__axisLabel">
          {t('linear')} (mm)
        </text>

        {/* thimble: the circular scale */}
        <g
          {...handlers}
          className={dragging ? 'is-dragging' : ''}
          style={{ cursor: 'grab' }}
        >
          <circle
            cx={DIAL_CX}
            cy={DIAL_CY}
            r={DIAL_R + 14}
            fill="transparent"
          />
          <circle cx={DIAL_CX} cy={DIAL_CY} r={DIAL_R} className="sim__dial" />
          <g transform={`rotate(${angle} ${DIAL_CX} ${DIAL_CY})`}>
            {Array.from({ length: divisions }, (_, k) => {
              const major = k % 10 === 0
              const rad = ((k / divisions) * 360 * Math.PI) / 180
              const outer = DIAL_R - 3
              const inner = DIAL_R - (major ? 18 : 9)
              return (
                <g key={`c${k}`}>
                  <line
                    x1={DIAL_CX + Math.sin(rad) * inner}
                    y1={DIAL_CY - Math.cos(rad) * inner}
                    x2={DIAL_CX + Math.sin(rad) * outer}
                    y2={DIAL_CY - Math.cos(rad) * outer}
                    className={`sim__tick ${
                      k === result.circularScale ? 'is-match' : ''
                    }`}
                  />
                  {major && (
                    <text
                      x={DIAL_CX + Math.sin(rad) * (DIAL_R - 34)}
                      y={DIAL_CY - Math.cos(rad) * (DIAL_R - 34) + 5}
                      className="sim__tickLabel"
                      textAnchor="middle"
                      transform={`rotate(${-angle} ${
                        DIAL_CX + Math.sin(rad) * (DIAL_R - 34)
                      } ${DIAL_CY - Math.cos(rad) * (DIAL_R - 34) + 5})`}
                    >
                      {toBanglaDigits(k, language)}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
          {/* fixed index mark against which the circular scale is read */}
          <path
            d={`M ${DIAL_CX} ${DIAL_CY - DIAL_R - 12}
                l 7 -13 l -14 0 Z`}
            className="sim__index"
          />
        </g>

        <text
          x={DIAL_CX}
          y={DIAL_CY + DIAL_R + 40}
          className="sim__axisLabel"
          textAnchor="middle"
        >
          {t('rotate')}
        </text>
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('pitch')}
          <output>{gaugeConfig.pitch} mm</output>
        </label>

        {!practice && (
          <>
            <Readout
              label={t('linear')}
              value={`${result.linearScale} mm`}
            />
            <Readout
              label={t('circular')}
              value={String(result.circularScale)}
            />
            <Readout
              label={t('least')}
              value={`${leastCount(gaugeConfig)} mm`}
            />
            <Readout
              label={t('reading')}
              value={`${result.reading.toFixed(2)} mm`}
              emphasis
            />
          </>
        )}

        {practice && (
          <div className="sim__practice">
            <label className="sim__control">
              {t('yourAnswer')}
              <input
                type="number"
                step="0.01"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value)
                  setVerdict(null)
                }}
              />
            </label>
            <button type="button" onClick={onCheck}>
              {t('check')}
            </button>
            <button type="button" onClick={onNext} className="is-secondary">
              {t('next')}
            </button>
            {verdict && (
              <p className={`sim__verdict is-${verdict}`}>
                {verdict === 'correct' ? t('correct') : t('wrong')}
              </p>
            )}
          </div>
        )}
      </div>
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

function randomLength(maxMm: number, config: ScrewGaugeConfig): number {
  const lc = leastCount(config)
  const steps = Math.floor((maxMm * 0.7) / lc)
  return Math.round((1 + Math.floor(Math.random() * steps)) * lc * 100) / 100
}
