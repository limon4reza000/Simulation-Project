import { useCallback, useMemo, useState } from 'react'
import { rubCharges } from '../../lib/electricity/electronTransfer'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ELECTRON_TRANSFER — আধান ও ঘর্ষণে চার্জ, §১০.১-১০.২
 *
 * Digitises §১০.১-১০.২ (pp. 272-275) as a discrete counting model: rubbing
 * two materials transfers a whole number of electrons, each worth exactly
 * e = 1.6e-19 C, so both resulting charges are always integer multiples of
 * e and always equal and opposite.
 */

interface Config {
  maxElectronsBillions?: number
}

interface Params {
  electronBillions?: number
}

const L = {
  title: { bn: 'ঘর্ষণে চার্জ স্থানান্তর', en: 'Charge Transfer by Friction' },
  electronCount: { bn: 'স্থানান্তরিত ইলেকট্রন (বিলিয়ন)', en: 'Electrons transferred (billions)' },
  giver: { bn: 'দাতা বস্তু (কাচ)', en: 'Giver (glass)' },
  taker: { bn: 'গ্রহীতা বস্তু (সিল্ক)', en: 'Taker (silk)' },
  note: {
    bn: 'প্রতিটি ইলেকট্রন ঠিক ১.৬ × ১০⁻¹⁹ কুলম্ব চার্জ বহন করে — তাই আধান সবসময় এই মৌলিক চার্জের পূর্ণসংখ্যক গুণিতক, ধারাবাহিক কোনো রাশি নয়।',
    en: 'Every electron carries exactly 1.6×10⁻¹⁹ C — so charge is always a whole-number multiple of that, never a continuous quantity.',
  },
} as const

type LabelKey = keyof typeof L

export default function ElectronTransfer({
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

  const maxElectronsBillions = cfg.maxElectronsBillions ?? 100

  const [electronBillions, setElectronBillions] = useState(params.electronBillions ?? 10)
  const [reported, setReported] = useState(false)

  const electronCount = Math.round(electronBillions * 1e9)
  const { giverCharge, takerCharge } = useMemo(() => rubCharges(electronCount), [electronCount])

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'ELECTRON_TRANSFER_EXPLORED',
        metadata: { electronCount, giverCharge, takerCharge },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, electronCount, giverCharge, takerCharge, onActivity])

  const barMax = 200
  const barLen = Math.min(barMax, (electronBillions / maxElectronsBillions) * barMax)

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 500 120" className="sim__svg" role="img" aria-label={t('title')}>
        <circle cx={80} cy={60} r={40} className="sim__dot is-match" />
        <circle cx={420} cy={60} r={40} className="sim__force-b" />
        <line
          x1={120}
          y1={60}
          x2={120 + barLen}
          y2={60}
          className="sim__marker"
          strokeWidth={4}
        />
      </svg>

      <label className="sim__control">
        {t('electronCount')}
        <input
          type="range"
          min={0}
          max={maxElectronsBillions}
          step={1}
          value={electronBillions}
          onChange={(e) => {
            setElectronBillions(Number(e.target.value))
            report()
          }}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('giver')} value={`+${num((giverCharge * 1e9).toFixed(3))} nC`} />
        <Readout label={t('taker')} value={`${num((takerCharge * 1e9).toFixed(3))} nC`} emphasis />
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
