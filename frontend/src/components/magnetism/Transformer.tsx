import { useCallback, useMemo, useState } from 'react'
import {
  secondaryVoltage,
  secondaryCurrent,
  transformerKind,
} from '../../lib/magnetism/transformer'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_TRANSFORMER — ট্রান্সফর্মার, চিত্র ১২.১৩–১২.১৫
 *
 * Digitises §১২.৩.২ (pp. 340-342): adjustable primary/secondary turns and
 * primary voltage, live secondary voltage and current, with a DC/AC toggle
 * that collapses the secondary voltage to zero on DC — the book's own first
 * worked example.
 */

interface Config {
  maxTurns?: number
  maxVoltageV?: number
  maxCurrentA?: number
}

interface Params {
  primaryTurns?: number
  secondaryTurns?: number
  primaryVoltageV?: number
  primaryCurrentA?: number
  isAC?: boolean
}

const L = {
  title: { bn: 'ট্রান্সফর্মার', en: 'Transformer' },
  primaryTurns: { bn: 'প্রাইমারি প্যাঁচসংখ্যা (nₚ)', en: 'Primary turns (np)' },
  secondaryTurns: { bn: 'সেকেন্ডারি প্যাঁচসংখ্যা (nₛ)', en: 'Secondary turns (ns)' },
  primaryVoltage: { bn: 'প্রাইমারি ভোল্টেজ (Vₚ)', en: 'Primary voltage (Vp)' },
  primaryCurrent: { bn: 'প্রাইমারি বিদ্যুৎপ্রবাহ (Iₚ)', en: 'Primary current (Ip)' },
  source: { bn: 'উৎস', en: 'Source' },
  dc: { bn: 'ডিসি (DC)', en: 'DC' },
  ac: { bn: 'এসি (AC)', en: 'AC' },
  secondaryVoltageLabel: { bn: 'সেকেন্ডারি ভোল্টেজ (Vₛ)', en: 'Secondary voltage (Vs)' },
  secondaryCurrentLabel: { bn: 'সেকেন্ডারি বিদ্যুৎপ্রবাহ (Iₛ)', en: 'Secondary current (Is)' },
  kind: { bn: 'ধরন', en: 'Kind' },
  stepUp: { bn: 'স্টেপ আপ', en: 'Step-up' },
  stepDown: { bn: 'স্টেপ ডাউন', en: 'Step-down' },
  isolation: { bn: 'আইসোলেশন', en: 'Isolation' },
  note: {
    bn: 'ট্রান্সফর্মার ডিসিতে কাজ করে না — চৌম্বক ক্ষেত্রের কোনো পরিবর্তন না হলে সেকেন্ডারিতে কোনো ভোল্টেজ তৈরি হয় না।',
    en: 'A transformer does nothing on DC — with no changing flux, no voltage is induced in the secondary.',
  },
} as const

type LabelKey = keyof typeof L

export default function Transformer({
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

  const maxTurns = cfg.maxTurns ?? 2000
  const maxVoltageV = cfg.maxVoltageV ?? 250
  const maxCurrentA = cfg.maxCurrentA ?? 5

  const [primaryTurns, setPrimaryTurns] = useState(params.primaryTurns ?? 100)
  const [secondaryTurns, setSecondaryTurns] = useState(params.secondaryTurns ?? 1000)
  const [primaryVoltage, setPrimaryVoltage] = useState(params.primaryVoltageV ?? 12)
  const [primaryCurrent, setPrimaryCurrent] = useState(params.primaryCurrentA ?? 1)
  const [isAC, setIsAC] = useState(params.isAC ?? true)
  const [reported, setReported] = useState(false)

  const vSecondary = useMemo(
    () => secondaryVoltage(primaryVoltage, primaryTurns, secondaryTurns, isAC),
    [primaryVoltage, primaryTurns, secondaryTurns, isAC],
  )
  const iSecondary = useMemo(
    () => secondaryCurrent(primaryCurrent, primaryTurns, secondaryTurns),
    [primaryCurrent, primaryTurns, secondaryTurns],
  )
  const kind = useMemo(
    () => transformerKind(primaryTurns, secondaryTurns),
    [primaryTurns, secondaryTurns],
  )

  const report = useCallback(() => {
    if (!reported) {
      setReported(true)
      onActivity?.({
        activityType: 'TRANSFORMER_EXPLORED',
        metadata: { primaryTurns, secondaryTurns, primaryVoltageV: primaryVoltage, isAC },
        occurredAt: new Date().toISOString(),
      })
    }
  }, [reported, primaryTurns, secondaryTurns, primaryVoltage, isAC, onActivity])

  const kindLabel =
    kind === 'step-up' ? t('stepUp') : kind === 'step-down' ? t('stepDown') : t('isolation')

  const coreW = 40
  const primaryCoils = Math.min(10, Math.max(2, Math.round(primaryTurns / 100)))
  const secondaryCoils = Math.min(10, Math.max(2, Math.round(secondaryTurns / 100)))

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 400 160" className="sim__svg" role="img" aria-label={t('title')}>
        <rect x={180} y={20} width={coreW} height={120} className="sim__object is-weak" />
        {Array.from({ length: primaryCoils }).map((_, i) => (
          <circle
            key={`p${i}`}
            cx={175}
            cy={30 + i * (100 / primaryCoils)}
            r={8}
            className="sim__dot is-match"
            fill="none"
            strokeWidth={2}
          />
        ))}
        {Array.from({ length: secondaryCoils }).map((_, i) => (
          <circle
            key={`s${i}`}
            cx={225}
            cy={30 + i * (100 / secondaryCoils)}
            r={8}
            className="sim__force-b"
            fill="none"
            strokeWidth={2}
          />
        ))}
      </svg>

      <div className="sim__panel">
        <label className="sim__control">
          {t('primaryTurns')}
          <input
            type="range"
            min={1}
            max={maxTurns}
            step={1}
            value={primaryTurns}
            onChange={(e) => {
              setPrimaryTurns(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('secondaryTurns')}
          <input
            type="range"
            min={1}
            max={maxTurns}
            step={1}
            value={secondaryTurns}
            onChange={(e) => {
              setSecondaryTurns(Number(e.target.value))
              report()
            }}
          />
        </label>
        <label className="sim__control">
          {t('primaryVoltage')} (V)
          <input
            type="range"
            min={0}
            max={maxVoltageV}
            step={1}
            value={primaryVoltage}
            onChange={(e) => setPrimaryVoltage(Number(e.target.value))}
          />
        </label>
        <label className="sim__control">
          {t('primaryCurrent')} (A)
          <input
            type="range"
            min={0}
            max={maxCurrentA}
            step={0.1}
            value={primaryCurrent}
            onChange={(e) => setPrimaryCurrent(Number(e.target.value))}
          />
        </label>
        <div className="sim__practice">
          <button type="button" onClick={() => setIsAC(false)} disabled={!isAC}>
            {t('dc')}
          </button>
          <button type="button" className="is-secondary" onClick={() => setIsAC(true)} disabled={isAC}>
            {t('ac')}
          </button>
        </div>
      </div>

      <div className="sim__panel">
        <Readout label={t('secondaryVoltageLabel')} value={`${num(vSecondary.toFixed(1))} V`} emphasis />
        <Readout label={t('secondaryCurrentLabel')} value={`${num(iSecondary.toFixed(3))} A`} />
        <Readout label={t('kind')} value={kindLabel} />
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
