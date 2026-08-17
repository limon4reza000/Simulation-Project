import { useCallback, useMemo, useState } from 'react'
import { chargeCarrierFor, classifyDopant } from '../../lib/electronics/semiconductorDoping'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_SEMICONDUCTOR_DOPING — সেমিকন্ডাক্টর, চিত্র ১৩.০৫
 *
 * Digitises §১৩.৪ (pp. 357-358) as a rule engine: a dopant's valence
 * electron count (relative to silicon's four) classifies the doped
 * semiconductor as n-type (free electron) or p-type (hole).
 */

interface Config {
  minValence?: number
  maxValence?: number
}

interface Params {
  dopantValenceElectrons?: number
}

const L = {
  title: { bn: 'n-টাইপ ও p-টাইপ সেমিকন্ডাক্টর', en: 'n-Type and p-Type Semiconductors' },
  valence: { bn: 'ডোপান্টের যোজন ইলেকট্রন সংখ্যা', en: "Dopant's valence electrons" },
  silicon: { bn: 'সিলিকনের যোজন ইলেকট্রন সংখ্যা = ৪', en: "Silicon's own valence electrons = 4" },
  kind: { bn: 'ফলাফল', en: 'Result' },
  nType: { bn: 'n-টাইপ', en: 'n-type' },
  pType: { bn: 'p-টাইপ', en: 'p-type' },
  intrinsic: { bn: 'অবিশুদ্ধ নয় (বিশুদ্ধ সিলিকন)', en: 'Undoped (intrinsic silicon)' },
  carrier: { bn: 'গতিশীল চার্জ বাহক', en: 'Mobile charge carrier' },
  freeElectron: { bn: 'মুক্ত ইলেকট্রন', en: 'Free electron' },
  hole: { bn: 'হোল', en: 'Hole' },
  none: { bn: 'নেই', en: 'None' },
  note: {
    bn: 'সিলিকনের চেয়ে বেশি যোজন ইলেকট্রনযুক্ত ডোপান্ট (যেমন ফসফরাস) মুক্ত ইলেকট্রন দেয় — n-টাইপ। কম যোজন ইলেকট্রনযুক্ত ডোপান্ট (যেমন বোরন) একটি হোল তৈরি করে — p-টাইপ।',
    en: 'A dopant with more valence electrons than silicon (e.g. phosphorus) gives a free electron — n-type. Fewer (e.g. boron) creates a hole — p-type.',
  },
} as const

type LabelKey = keyof typeof L

export default function SemiconductorDoping({
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

  const minValence = cfg.minValence ?? 3
  const maxValence = cfg.maxValence ?? 5

  const [valence, setValence] = useState(params.dopantValenceElectrons ?? 5)
  const [reported, setReported] = useState(false)

  const kind = useMemo(() => classifyDopant(valence), [valence])
  const carrier = useMemo(() => chargeCarrierFor(valence), [valence])

  const report = useCallback(
    (nextValence: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'SEMICONDUCTOR_DOPING_EXPLORED',
          metadata: { dopantValenceElectrons: nextValence },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const dotColor = kind === 'n-type' ? 'sim__dot is-match' : kind === 'p-type' ? 'sim__force-b' : 'sim__object is-weak'

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 200 100" className="sim__svg" role="img" aria-label={t('kind')}>
        {Array.from({ length: 9 }).map((_, i) => (
          <circle
            key={i}
            cx={30 + (i % 3) * 60}
            cy={20 + Math.floor(i / 3) * 30}
            r={12}
            className="sim__object is-weak"
          />
        ))}
        <circle cx={90} cy={50} r={14} className={dotColor} />
      </svg>

      <label className="sim__control">
        {t('valence')}
        <input
          type="range"
          min={minValence}
          max={maxValence}
          step={1}
          value={valence}
          onChange={(e) => {
            const v = Number(e.target.value)
            setValence(v)
            report(v)
          }}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('silicon')} value="" />
        <Readout
          label={t('kind')}
          value={kind === 'n-type' ? t('nType') : kind === 'p-type' ? t('pType') : t('intrinsic')}
          emphasis
        />
        <Readout
          label={t('carrier')}
          value={carrier === 'free electron' ? t('freeElectron') : carrier === 'hole' ? t('hole') : t('none')}
        />
        <Readout label="" value={num(valence)} />
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
