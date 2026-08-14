import { useCallback, useMemo, useState } from 'react'
import {
  propagateProduct,
  type Measurement,
} from '../../lib/measurement/errorPropagation'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ERROR_PROPAGATION — পরিমাপের ত্রুটি ও নির্ভুলতা
 *
 * Digitises the worked example on book p. 28: a box measured with a cm-only
 * ruler as 10 ± 0.5, 5 ± 0.5, 4 ± 0.5 cm, giving 149.625 cm³ < V < 259.875 cm³
 * and a relative error of about 30 %.
 *
 * The defaults reproduce the printed example exactly, so a student can hold the
 * book beside the screen and see the same numbers. errorPropagation.test.ts
 * asserts those numbers, so the agreement cannot silently regress.
 */

const VIEW_W = 900
const VIEW_H = 150

interface Config {
  unit?: string
  unitBn?: string
}

interface Params {
  dimensions?: { value: number; uncertainty: number; labelBn: string; labelEn: string }[]
}

const DEFAULT_DIMENSIONS = [
  { value: 10, uncertainty: 0.5, labelBn: 'দৈর্ঘ্য', labelEn: 'Length' },
  { value: 5, uncertainty: 0.5, labelBn: 'প্রস্থ', labelEn: 'Width' },
  { value: 4, uncertainty: 0.5, labelBn: 'উচ্চতা', labelEn: 'Height' },
]

const L = {
  title: { bn: 'পরিমাপের ত্রুটি ও নির্ভুলতা', en: 'Error and Accuracy' },
  nominal: { bn: 'মাপা আয়তন', en: 'Measured volume' },
  minimum: { bn: 'সবচেয়ে ছোট আয়তন', en: 'Smallest volume' },
  maximum: { bn: 'সবচেয়ে বড় আয়তন', en: 'Largest volume' },
  absolute: { bn: 'চূড়ান্ত ত্রুটি', en: 'Absolute error' },
  relative: { bn: 'আপেক্ষিক ত্রুটি', en: 'Relative error' },
  uncertainty: { bn: 'অনিশ্চয়তা', en: 'Uncertainty' },
  note: {
    bn: 'দৈর্ঘ্যে ত্রুটি হলে ক্ষেত্রফলে তা প্রায় দ্বিগুণ, আয়তনে তিন গুণ হয়।',
    en: 'An error in length roughly doubles in area and triples in volume.',
  },
} as const

type LabelKey = keyof typeof L

export default function ErrorPropagationLab({
  config,
  parameters,
  language = 'BN',
}: RendererProps<Config, Params>) {
  const cfg = (config ?? {}) as Config
  const params = (parameters ?? {}) as Params

  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (value: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(value), 'BN') : String(value),
    [language],
  )

  const unit = language === 'BN' ? (cfg.unitBn ?? 'cm') : (cfg.unit ?? 'cm')

  const [dims, setDims] = useState(params.dimensions ?? DEFAULT_DIMENSIONS)

  const update = useCallback(
    (index: number, field: 'value' | 'uncertainty', next: number) => {
      setDims((current) =>
        current.map((d, i) => (i === index ? { ...d, [field]: next } : d)),
      )
    },
    [],
  )

  const measurements: Measurement[] = useMemo(
    () => dims.map((d) => ({ value: d.value, uncertainty: d.uncertainty })),
    [dims],
  )

  const result = useMemo(() => propagateProduct(measurements), [measurements])
  const power = dims.length === 1 ? '' : dims.length === 2 ? '²' : '³'

  // Scale the range bar so the spread is always legible.
  const span = result.maximum - result.minimum || 1
  const pad = span * 0.12
  const lo = result.minimum - pad
  const hi = result.maximum + pad
  const toX = (v: number) => 40 + ((v - lo) / (hi - lo)) * (VIEW_W - 80)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <div className="sim__sliders">
        {dims.map((d, i) => (
          <div key={d.labelEn} className="sim__sliderRow">
            <span className="sim__sliderLabel">
              {language === 'BN' ? d.labelBn : d.labelEn}
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={0.5}
              value={d.value}
              onChange={(e) => update(i, 'value', Number(e.target.value))}
              aria-label={`${language === 'BN' ? d.labelBn : d.labelEn} value`}
            />
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={d.uncertainty}
              onChange={(e) => update(i, 'uncertainty', Number(e.target.value))}
              aria-label={`${language === 'BN' ? d.labelBn : d.labelEn} uncertainty`}
            />
            <output className="sim__sliderValue">
              ({num(d.value.toFixed(1))} ± {num(d.uncertainty.toFixed(1))}) {unit}
            </output>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        {/* the band of volumes consistent with the measurement */}
        <rect
          x={toX(result.minimum)}
          y={44}
          width={Math.max(2, toX(result.maximum) - toX(result.minimum))}
          height={40}
          className="sim__band"
          rx={4}
        />
        <line
          x1={40}
          y1={64}
          x2={VIEW_W - 40}
          y2={64}
          className="sim__datum"
        />

        {[
          { v: result.minimum, key: 'minimum' as const, anchor: 'start' },
          { v: result.nominal, key: 'nominal' as const, anchor: 'middle' },
          { v: result.maximum, key: 'maximum' as const, anchor: 'end' },
        ].map(({ v, key, anchor }) => (
          <g key={key}>
            <line
              x1={toX(v)}
              y1={34}
              x2={toX(v)}
              y2={94}
              className={`sim__tick ${key === 'nominal' ? 'is-match' : ''}`}
            />
            <text
              x={toX(v)}
              y={24}
              className="sim__tickLabel"
              textAnchor={anchor as 'start' | 'middle' | 'end'}
            >
              {num(v.toFixed(3))}
            </text>
            <text
              x={toX(v)}
              y={116}
              className="sim__axisLabel"
              textAnchor={anchor as 'start' | 'middle' | 'end'}
            >
              {t(key)}
            </text>
          </g>
        ))}
      </svg>

      <div className="sim__panel">
        <Readout
          label={`${t('nominal')} V`}
          value={`${num(result.nominal)} ${unit}${power}`}
        />
        <Readout
          label={t('absolute')}
          value={`${num(result.absoluteError)} ${unit}${power}`}
        />
        <Readout
          label={t('relative')}
          value={`${num(result.relativeErrorPercent.toFixed(2))} %`}
          emphasis
        />
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
