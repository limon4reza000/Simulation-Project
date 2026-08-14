import { useCallback, useMemo, useRef, useState } from 'react'
import {
  readVernier,
  vernierDivisionLength,
  checkVernierAnswer,
  type VernierConfig,
} from '../../lib/instruments/vernier'
import { useSvgDrag } from '../../lib/useSvgDrag'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_VERNIER_CALIPER — ভার্নিয়ার ক্যালিপার্স
 *
 * Digitises অনুসন্ধান ১.০১ (book p. 25) and the figures on pp. 20–22.
 *
 * Rendered as SVG rather than Canvas for three reasons that all matter here:
 * Bangla labels shape correctly through the normal text pipeline (Canvas
 * fillText does not handle conjuncts reliably); the scale stays crisp at the
 * zoom needed to read a tenth of a division; and the geometry is one static
 * scale plus one translated group, so there is no redraw loop to justify.
 */

const VIEW_W = 900
const VIEW_H = 300
const ORIGIN_X = 50
const PX_PER_MM = 12
const MAX_MM = 60

const BEAM_TOP = 100
const BEAM_BOTTOM = 150
const JAW_TOP = 40

interface Config {
  maxLengthMm?: number
}

interface Params {
  mainScaleDivision?: number
  vernierDivisions?: number
  objectLength?: number
  mode?: 'explore' | 'practice'
}

const L = {
  title: { bn: 'ভার্নিয়ার ক্যালিপার্স', en: 'Vernier Calipers' },
  mainScale: { bn: 'প্রধান স্কেল', en: 'Main scale' },
  vernierScale: { bn: 'ভার্নিয়ার স্কেল', en: 'Vernier scale' },
  reading: { bn: 'পাঠ', en: 'Reading' },
  mainReading: { bn: 'প্রধান স্কেল পাঠ M', en: 'Main scale reading M' },
  coincidence: { bn: 'ভার্নিয়ার সমপাতন V', en: 'Vernier coincidence V' },
  constant: { bn: 'ভার্নিয়ার ধ্রুবক VC', en: 'Vernier constant VC' },
  divisions: { bn: 'ভার্নিয়ার ভাগসংখ্যা', en: 'Vernier divisions' },
  drag: { bn: 'চোয়াল টেনে সরাও', en: 'Drag the jaw' },
  yourAnswer: { bn: 'তোমার পাঠ (mm)', en: 'Your reading (mm)' },
  check: { bn: 'মিলিয়ে দেখো', en: 'Check' },
  next: { bn: 'নতুন পরিমাপ', en: 'New measurement' },
  correct: { bn: 'সঠিক হয়েছে!', en: 'Correct!' },
  wrong: { bn: 'আবার চেষ্টা করো', en: 'Try again' },
} as const

type LabelKey = keyof typeof L

export default function VernierCaliper({
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

  const vernierConfig: VernierConfig = useMemo(
    () => ({
      mainScaleDivision: params.mainScaleDivision ?? 1,
      vernierDivisions: params.vernierDivisions ?? 10,
    }),
    [params.mainScaleDivision, params.vernierDivisions],
  )

  const maxMm = Math.min(cfg.maxLengthMm ?? MAX_MM, MAX_MM)
  const practice = params.mode === 'practice'

  const [length, setLength] = useState(() =>
    practice ? randomLength(maxMm, vernierConfig) : (params.objectLength ?? 24.4),
  )
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<'correct' | 'wrong' | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)

  const handleDrag = useCallback(
    ({ x }: { x: number }) => {
      const mm = (x - ORIGIN_X) / PX_PER_MM
      setLength(Math.max(0, Math.min(maxMm, Math.round(mm * 100) / 100)))
    },
    [maxMm],
  )

  const viewBox = useMemo(() => ({ width: VIEW_W, height: VIEW_H }), [])
  const { dragging, handlers } = useSvgDrag(svgRef, viewBox, {
    onMove: handleDrag,
  })

  const result = useMemo(
    () => readVernier(length, vernierConfig),
    [length, vernierConfig],
  )
  const vdl = vernierDivisionLength(vernierConfig)
  const jawX = ORIGIN_X + length * PX_PER_MM
  const n = vernierConfig.vernierDivisions

  const onCheck = useCallback(() => {
    const submitted = Number.parseFloat(answer)
    if (Number.isNaN(submitted)) return
    const check = checkVernierAnswer(submitted, length, vernierConfig)
    setVerdict(check.correct ? 'correct' : 'wrong')
    onActivity?.({
      activityType: 'VERNIER_ANSWER_SUBMITTED',
      metadata: { correct: check.correct },
      occurredAt: new Date().toISOString(),
    })
  }, [answer, length, vernierConfig, onActivity])

  const onNext = useCallback(() => {
    setLength(randomLength(maxMm, vernierConfig))
    setAnswer('')
    setVerdict(null)
  }, [maxMm, vernierConfig])

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
        {/* object under measurement */}
        {length > 0 && (
          <rect
            x={ORIGIN_X}
            y={JAW_TOP + 18}
            width={length * PX_PER_MM}
            height={42}
            className="sim__object"
            rx={3}
          />
        )}

        {/* beam */}
        <rect
          x={20}
          y={BEAM_TOP}
          width={VIEW_W - 60}
          height={BEAM_BOTTOM - BEAM_TOP}
          className="sim__beam"
        />

        {/* fixed jaw */}
        <path
          d={`M ${ORIGIN_X} ${JAW_TOP} L ${ORIGIN_X} ${BEAM_TOP + 10}
              L ${ORIGIN_X - 16} ${BEAM_TOP + 10} L ${ORIGIN_X - 16} ${JAW_TOP}
              L ${ORIGIN_X - 4} ${JAW_TOP} Z`}
          className="sim__jaw"
        />

        {/* main scale ticks */}
        {mainTicks(maxMm, vernierConfig.mainScaleDivision).map((tick) => (
          <g key={`m${tick.mm}`}>
            <line
              x1={ORIGIN_X + tick.mm * PX_PER_MM}
              y1={BEAM_BOTTOM}
              x2={ORIGIN_X + tick.mm * PX_PER_MM}
              y2={BEAM_BOTTOM - tick.height}
              className="sim__tick"
            />
            {tick.label !== undefined && (
              <text
                x={ORIGIN_X + tick.mm * PX_PER_MM}
                y={BEAM_BOTTOM - tick.height - 6}
                className="sim__tickLabel"
                textAnchor="middle"
              >
                {toBanglaDigits(tick.label, language)}
              </text>
            )}
          </g>
        ))}

        {/* Above the jaws, not just above the beam — the object being measured
            occupies the band between them and would sit on top of the label. */}
        <text x={26} y={JAW_TOP - 12} className="sim__axisLabel">
          {t('mainScale')} (cm)
        </text>

        {/* sliding vernier assembly */}
        <g
          className={`sim__slider ${dragging ? 'is-dragging' : ''}`}
          {...handlers}
          style={{ cursor: 'ew-resize' }}
        >
          {/* generous invisible hit area — thin ticks are unusable on touch */}
          <rect
            x={jawX - 24}
            y={JAW_TOP}
            width={(n - 1) * vernierConfig.mainScaleDivision * PX_PER_MM + 60}
            height={BEAM_BOTTOM + 50 - JAW_TOP}
            fill="transparent"
          />

          {/* moving jaw */}
          <path
            d={`M ${jawX} ${JAW_TOP} L ${jawX} ${BEAM_TOP + 10}
                L ${jawX + 16} ${BEAM_TOP + 10} L ${jawX + 16} ${JAW_TOP}
                L ${jawX + 4} ${JAW_TOP} Z`}
            className="sim__jaw"
          />

          {/* vernier body */}
          <rect
            x={jawX - 6}
            y={BEAM_BOTTOM}
            width={(n - 1) * vernierConfig.mainScaleDivision * PX_PER_MM + 24}
            height={44}
            className="sim__vernierBody"
            rx={3}
          />

          {/* vernier ticks */}
          {Array.from({ length: n + 1 }, (_, k) => {
            const x = ORIGIN_X + (length + k * vdl) * PX_PER_MM
            const isMatch = k === result.vernierCoincidence
            return (
              <g key={`v${k}`}>
                <line
                  x1={x}
                  y1={BEAM_BOTTOM}
                  x2={x}
                  y2={BEAM_BOTTOM + (isMatch ? 26 : 16)}
                  className={`sim__tick ${isMatch ? 'is-match' : ''}`}
                />
                {(k === 0 || k === n || k % 5 === 0) && (
                  <text
                    x={x}
                    y={BEAM_BOTTOM + 40}
                    className={`sim__tickLabel ${isMatch ? 'is-match' : ''}`}
                    textAnchor="middle"
                  >
                    {toBanglaDigits(k, language)}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        <text x={26} y={BEAM_BOTTOM + 70} className="sim__axisLabel">
          {t('vernierScale')} — {t('drag')}
        </text>
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('divisions')}
          <output>{toBanglaDigits(n, language)}</output>
        </label>

        {!practice && (
          <>
            <Readout label={t('mainReading')} value={`${result.mainScale} mm`} />
            <Readout
              label={t('coincidence')}
              value={String(result.vernierCoincidence)}
            />
            <Readout
              label={t('constant')}
              value={`${result.vernierConstant} mm`}
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

function mainTicks(maxMm: number, division: number) {
  const ticks: { mm: number; height: number; label?: number }[] = []
  for (let mm = 0; mm <= maxMm; mm += division) {
    const isTen = Math.round(mm) % 10 === 0
    const isFive = Math.round(mm) % 5 === 0
    ticks.push({
      mm,
      height: isTen ? 26 : isFive ? 18 : 11,
      label: isTen ? Math.round(mm) / 10 : undefined,
    })
  }
  return ticks
}

/** Picks a length that lands cleanly on the instrument's least count. */
function randomLength(maxMm: number, config: VernierConfig): number {
  const steps = Math.floor((maxMm * 0.7) / (config.mainScaleDivision / config.vernierDivisions))
  const step = 1 + Math.floor(Math.random() * steps)
  return Math.round(step * (config.mainScaleDivision / config.vernierDivisions) * 100) / 100
}

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

/**
 * Bangla numerals in Bangla mode. A "Bangla interface" that renders ৭ as 7 in
 * every scale label is not actually a Bangla interface.
 */
export function toBanglaDigits(value: number, language: 'BN' | 'EN'): string {
  const text = String(value)
  if (language !== 'BN') return text
  return text.replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)])
}
