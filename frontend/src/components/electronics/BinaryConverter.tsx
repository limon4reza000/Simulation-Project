import { useCallback, useMemo, useState } from 'react'
import { bitsFor, decimalToBinary } from '../../lib/electronics/binaryConverter'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_BINARY_CONVERTER — অ্যানালগ ও ডিজিটাল, বাইনারি সংখ্যা, §১৩.৩
 *
 * Digitises §১৩.৩'s own foundational point for digital electronics
 * (pp. 356-357): any value can be represented as a binary (0/1) number
 * rather than a continuous analog voltage. A decimal slider drives a live
 * bit-pattern display and the binary string itself.
 */

const WIDTH_BITS = 8

interface Config {
  maxDecimal?: number
}

interface Params {
  decimalValue?: number
}

const L = {
  title: { bn: 'দশমিক ও বাইনারি সংখ্যা', en: 'Decimal and Binary Numbers' },
  decimal: { bn: 'দশমিক মান', en: 'Decimal value' },
  binary: { bn: 'বাইনারি মান', en: 'Binary value' },
  on: { bn: '১', en: '1' },
  off: { bn: '০', en: '0' },
  note: {
    bn: 'ডিজিটাল ইলেকট্রনিকসে প্রতিটি সংখ্যাকে কেবল ০ এবং ১ দিয়ে প্রকাশ করা হয় — একটি ভোল্টেজকে ১ এবং অন্যটিকে ০ ধরে — যা নয়েজ প্রতিরোধী, কারণ ভোল্টেজকে শুধু দুটি অবস্থার একটি হিসেবে চিনলেই চলে।',
    en: 'Digital electronics represents every value with just 0 and 1 — one voltage read as 1, another as 0 — which resists noise, since a voltage only needs to be told apart as one of two states.',
  },
} as const

type LabelKey = keyof typeof L

export default function BinaryConverter({
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

  const maxDecimal = cfg.maxDecimal ?? 2 ** WIDTH_BITS - 1

  const [decimalValue, setDecimalValue] = useState(params.decimalValue ?? 42)
  const [reported, setReported] = useState(false)

  const bits = useMemo(() => bitsFor(decimalValue, WIDTH_BITS), [decimalValue])
  const binaryString = useMemo(() => decimalToBinary(decimalValue), [decimalValue])

  const report = useCallback(
    (nextValue: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'BINARY_CONVERTER_EXPLORED',
          metadata: { decimalValue: nextValue },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 320 80" className="sim__svg" role="img" aria-label={t('binary')}>
        {bits.map((bit, i) => (
          <g key={i}>
            <rect
              x={10 + i * 38}
              y={10}
              width={30}
              height={50}
              className={bit ? 'sim__dot is-match' : 'sim__object is-weak'}
              rx={4}
            />
            <text x={10 + i * 38 + 15} y={40} textAnchor="middle" className="sim__axisLabel">
              {bit ? t('on') : t('off')}
            </text>
          </g>
        ))}
      </svg>

      <label className="sim__control">
        {t('decimal')}
        <input
          type="range"
          min={0}
          max={maxDecimal}
          step={1}
          value={decimalValue}
          onChange={(e) => {
            const v = Number(e.target.value)
            setDecimalValue(v)
            report(v)
          }}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('decimal')} value={num(decimalValue)} />
        <Readout label={t('binary')} value={binaryString} emphasis />
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
