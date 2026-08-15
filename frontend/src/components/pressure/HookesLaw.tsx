import { useCallback, useMemo, useState } from 'react'
import { nearestReading, withinElasticLimit } from '../../lib/pressure/hookesLaw'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_HOOKES_LAW — স্থিতিস্থাপকতা ও হুকের সূত্র, চিত্র ৫.১১, সৃজনশীল প্রশ্ন ২ (p. 157)
 *
 * Digitises §৫.৫ directly using the book's own printed rubber-band dataset
 * rather than an idealised formula: length under load rises steadily with
 * mass, and the length the band relaxes back to stays exactly 10 cm through
 * 3 kg, then drifts upward at 4 kg and 5 kg — the elastic limit made visible
 * in the book's own numbers, not just asserted.
 */

const MAX_MASS = 5

interface Config {
  maxMassKg?: number
}

type Params = Record<string, never>

const L = {
  title: { bn: 'স্থিতিস্থাপকতা ও হুকের সূত্র', en: "Elasticity and Hooke's Law" },
  mass: { bn: 'ঝুলানো ভর', en: 'Hanging mass' },
  loadedLength: { bn: 'ভারযুক্ত দৈর্ঘ্য (L₂)', en: 'Loaded length (L₂)' },
  relaxedLength: { bn: 'ভার সরানোর পর দৈর্ঘ্য (L₁)', en: 'Relaxed length after removal (L₁)' },
  status: { bn: 'অবস্থা', en: 'Status' },
  elastic: { bn: 'স্থিতিস্থাপক সীমার মধ্যে', en: 'Within elastic limit' },
  permanent: { bn: 'স্থায়ী বিকৃতি ঘটেছে', en: 'Permanently deformed' },
  note: {
    bn: '৩ kg পর্যন্ত ভার সরালে ব্যান্ডটি ঠিক ১০ cm-এ ফিরে আসে। তার বেশি ভার দিলে স্থিতিস্থাপক সীমা পার হয়ে যায় এবং ব্যান্ডটি আর আগের দৈর্ঘ্যে ফেরে না।',
    en: 'Up to 3 kg, the band returns to exactly 10 cm once unloaded. Beyond that, the elastic limit is passed and it never returns to its original length.',
  },
} as const

type LabelKey = keyof typeof L

export default function HookesLaw({
  config,
  language = 'BN',
  onActivity,
}: RendererProps<Config, Params>) {
  const cfg = (config ?? {}) as Config
  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (v: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(v), 'BN') : String(v),
    [language],
  )

  const maxMassKg = cfg.maxMassKg ?? MAX_MASS

  const [mass, setMass] = useState(0)
  const [reported, setReported] = useState(false)

  const reading = useMemo(() => nearestReading(mass), [mass])
  const elastic = useMemo(() => withinElasticLimit(mass, 3), [mass])

  const report = useCallback(
    (nextMass: number) => {
      if (!reported && nextMass > 3) {
        setReported(true)
        onActivity?.({
          activityType: 'HOOKES_LAW_LIMIT_PASSED',
          metadata: { massKg: nextMass },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, onActivity],
  )

  const bandLenPx = 40 + reading.loadedLengthCm * 4

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 200 260" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={60} y1={20} x2={140} y2={20} className="sim__datum" strokeWidth={6} />
        <line x1={100} y1={20} x2={100} y2={20 + bandLenPx} className="sim__beam" strokeWidth={4} />
        <rect x={80} y={20 + bandLenPx} width={40} height={24} className={elastic ? 'sim__object' : 'sim__dot is-match'} rx={4} />
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('mass')} (kg)
          <input
            type="range"
            min={0}
            max={maxMassKg}
            step={0.1}
            value={mass}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMass(v)
              report(v)
            }}
          />
        </label>
      </div>

      <div className="sim__panel">
        <Readout label={t('loadedLength')} value={`${num(reading.loadedLengthCm.toFixed(1))} cm`} emphasis />
        <Readout label={t('relaxedLength')} value={`${num(reading.relaxedLengthCm.toFixed(1))} cm`} />
        <Readout
          label={t('status')}
          value={elastic ? t('elastic') : t('permanent')}
          emphasis={!elastic}
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
