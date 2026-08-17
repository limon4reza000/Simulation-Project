import { useCallback, useMemo, useState } from 'react'
import { analyzeSeries, analyzeParallel } from '../../lib/circuits/seriesParallel'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_SERIES_PARALLEL_CIRCUIT — তুল্য রোধ, চিত্র ১১.০৯–১১.১৪
 *
 * Digitises §১১.২.৩-১১.২.৫ (pp. 309-317): a series/parallel toggle over two
 * resistors and a battery, live equivalent resistance, total current, and
 * the current/voltage split across each resistor.
 */

type Mode = 'series' | 'parallel'

interface Config {
  maxVoltageV?: number
  maxResistanceOhm?: number
}

interface Params {
  mode?: Mode
  voltageV?: number
  r1?: number
  r2?: number
}

const L = {
  title: { bn: 'শ্রেণি ও সমান্তরাল বর্তনী', en: 'Series and Parallel Circuits' },
  series: { bn: 'শ্রেণি', en: 'Series' },
  parallel: { bn: 'সমান্তরাল', en: 'Parallel' },
  voltage: { bn: 'বিভব পার্থক্য (V)', en: 'Voltage (V)' },
  r1: { bn: 'রোধ R১', en: 'Resistor R1' },
  r2: { bn: 'রোধ R২', en: 'Resistor R2' },
  equivalent: { bn: 'তুল্য রোধ', en: 'Equivalent resistance' },
  totalCurrent: { bn: 'মোট বিদ্যুৎপ্রবাহ', en: 'Total current' },
  branch1: { bn: 'R১-এর মধ্য দিয়ে', en: 'Through R1' },
  branch2: { bn: 'R২-এর মধ্য দিয়ে', en: 'Through R2' },
  note: {
    bn: 'শ্রেণি সংযোগে রোধ যোগ হয়ে বাড়ে; সমান্তরাল সংযোগে তুল্য রোধ সবসময় ক্ষুদ্রতম রোধের চেয়েও কম হয়।',
    en: 'In series, resistances add and increase; in parallel, the equivalent is always less than the smallest single resistor.',
  },
} as const

type LabelKey = keyof typeof L

export default function SeriesParallelCircuit({
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

  const [mode, setMode] = useState<Mode>(params.mode ?? 'series')
  const [voltage, setVoltage] = useState(params.voltageV ?? 6)
  const [r1, setR1] = useState(params.r1 ?? 5)
  const [r2, setR2] = useState(params.r2 ?? 10)
  const [reported, setReported] = useState(false)

  const seriesResult = useMemo(() => analyzeSeries(voltage, [r1, r2]), [voltage, r1, r2])
  const parallelResult = useMemo(() => analyzeParallel(voltage, [r1, r2]), [voltage, r1, r2])
  const result = mode === 'series' ? seriesResult : parallelResult

  const report = useCallback(
    (nextMode: Mode) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'SERIES_PARALLEL_EXPLORED',
          metadata: { mode: nextMode, voltageV: voltage, r1, r2 },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, voltage, r1, r2, onActivity],
  )

  const barMax = 900
  const eqFrac = Math.min(1, result.equivalentOhm / (2 * maxResistanceOhm))

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <div className="sim__practice">
        <button
          type="button"
          onClick={() => {
            setMode('series')
            report('series')
          }}
          disabled={mode === 'series'}
        >
          {t('series')}
        </button>
        <button
          type="button"
          className="is-secondary"
          onClick={() => {
            setMode('parallel')
            report('parallel')
          }}
          disabled={mode === 'parallel'}
        >
          {t('parallel')}
        </button>
      </div>

      <svg viewBox={`0 0 ${barMax} 60`} className="sim__svg" role="img" aria-label={t('equivalent')}>
        <rect x={0} y={15} width={barMax} height={30} className="sim__object is-weak" />
        <rect x={0} y={15} width={eqFrac * barMax} height={30} className="sim__dot is-match" />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('voltage')} (V)
          <input
            type="range"
            min={0.5}
            max={maxVoltageV}
            step={0.5}
            value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('r1')} (Ω)
          <input
            type="range"
            min={1}
            max={maxResistanceOhm}
            step={1}
            value={r1}
            onChange={(e) => setR1(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('r2')} (Ω)
          <input
            type="range"
            min={1}
            max={maxResistanceOhm}
            step={1}
            value={r2}
            onChange={(e) => setR2(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('equivalent')} value={`${num(result.equivalentOhm.toFixed(2))} Ω`} emphasis />
        {mode === 'series' ? (
          <Readout label={t('totalCurrent')} value={`${num(seriesResult.currentA.toFixed(3))} A`} />
        ) : (
          <>
            <Readout label={t('branch1')} value={`${num(parallelResult.branchCurrentsA[0].toFixed(3))} A`} />
            <Readout label={t('branch2')} value={`${num(parallelResult.branchCurrentsA[1].toFixed(3))} A`} />
            <Readout label={t('totalCurrent')} value={`${num(parallelResult.totalCurrentA.toFixed(3))} A`} />
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
