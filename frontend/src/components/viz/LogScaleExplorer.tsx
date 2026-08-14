import { useCallback, useMemo, useState } from 'react'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * VIZ_LOG_SCALE_EXPLORER — রাশির মাপনী
 *
 * Digitises টেবিল ১.০২ (book p. 15), which lists distances from a proton radius
 * to the nearest galaxy, masses from an electron to our galaxy, and times from
 * a gamma-ray period to the age of the universe.
 *
 * The table makes the point that measurement spans 37 orders of magnitude. A
 * table cannot make that *felt*; a single logarithmic axis can, which is also
 * the argument for why SI prefixes exist (§১.৫.২).
 *
 * Entirely data-driven — the tracks below are configuration, not code, so the
 * same renderer serves any "scale of things" table in any chapter.
 */

const VIEW_W = 900
const VIEW_H = 260
const PAD_X = 60

interface ScaleItem {
  labelBn: string
  labelEn: string
  value: number
}

interface Track {
  key: string
  nameBn: string
  nameEn: string
  unit: string
  items: ScaleItem[]
}

const TRACKS: Track[] = [
  {
    key: 'distance',
    nameBn: 'দূরত্ব',
    nameEn: 'Distance',
    unit: 'm',
    items: [
      { labelBn: 'প্রোটনের ব্যাসার্ধ', labelEn: 'Proton radius', value: 1e-15 },
      { labelBn: 'হাইড্রোজেন পরমাণুর ব্যাসার্ধ', labelEn: 'Hydrogen atom radius', value: 5e-11 },
      { labelBn: 'ভাইরাসের দৈর্ঘ্য', labelEn: 'Virus length', value: 1e-8 },
      { labelBn: 'এভারেস্টের উচ্চতা', labelEn: 'Height of Everest', value: 9e3 },
      { labelBn: 'পৃথিবীর ব্যাসার্ধ', labelEn: 'Radius of Earth', value: 6e6 },
      { labelBn: 'সৌরজগতের ব্যাসার্ধ', labelEn: 'Radius of solar system', value: 6e12 },
      { labelBn: 'নিকটতম নক্ষত্র', labelEn: 'Nearest star', value: 4e16 },
      { labelBn: 'নিকটতম গ্যালাক্সি', labelEn: 'Nearest galaxy', value: 2e22 },
    ],
  },
  {
    key: 'mass',
    nameBn: 'ভর',
    nameEn: 'Mass',
    unit: 'kg',
    items: [
      { labelBn: 'ইলেকট্রন', labelEn: 'Electron', value: 9e-31 },
      { labelBn: 'ধূলিকণা', labelEn: 'Dust particle', value: 7e-7 },
      { labelBn: 'মানুষ', labelEn: 'Human', value: 6e1 },
      { labelBn: 'হাতি', labelEn: 'Elephant', value: 5e3 },
      { labelBn: 'জাহাজ', labelEn: 'Ship', value: 7e7 },
      { labelBn: 'পৃথিবী', labelEn: 'Earth', value: 6e24 },
      { labelBn: 'সূর্য', labelEn: 'Sun', value: 2e30 },
      { labelBn: 'আমাদের গ্যালাক্সি', labelEn: 'Our galaxy', value: 2e41 },
    ],
  },
  {
    key: 'time',
    nameBn: 'সময়',
    nameEn: 'Time',
    unit: 's',
    items: [
      { labelBn: 'স্পন্দনকাল: গামা রশ্মি', labelEn: 'Gamma ray period', value: 4e-21 },
      { labelBn: 'স্পন্দনকাল: সবুজ আলো', labelEn: 'Green light period', value: 2e-15 },
      { labelBn: 'মিউওনের আয়ু', labelEn: 'Muon lifetime', value: 2e-6 },
      { labelBn: 'মানুষের হৃৎস্পন্দন', labelEn: 'Human heartbeat', value: 1 },
      { labelBn: 'এক দিন', labelEn: 'One day', value: 9e4 },
      { labelBn: 'মানুষের অভ্যুদয়ের পর', labelEn: 'Since humans appeared', value: 8e12 },
      { labelBn: 'ডাইনোসর ধ্বংসের পর', labelEn: 'Since dinosaur extinction', value: 2e14 },
      { labelBn: 'বিগ ব্যাংয়ের পর', labelEn: 'Since the Big Bang', value: 4e17 },
    ],
  },
]

/** টেবিল ১.০৫, book p. 18. */
const PREFIXES: { symbol: string; nameBn: string; exponent: number }[] = [
  { symbol: 'a', nameBn: 'এটো', exponent: -18 },
  { symbol: 'f', nameBn: 'ফেমটো', exponent: -15 },
  { symbol: 'p', nameBn: 'পিকো', exponent: -12 },
  { symbol: 'n', nameBn: 'ন্যানো', exponent: -9 },
  { symbol: 'µ', nameBn: 'মাইক্রো', exponent: -6 },
  { symbol: 'm', nameBn: 'মিলি', exponent: -3 },
  { symbol: 'c', nameBn: 'সেন্টি', exponent: -2 },
  { symbol: 'd', nameBn: 'ডেসি', exponent: -1 },
  { symbol: '', nameBn: '—', exponent: 0 },
  { symbol: 'da', nameBn: 'ডেকা', exponent: 1 },
  { symbol: 'h', nameBn: 'হেক্টো', exponent: 2 },
  { symbol: 'k', nameBn: 'কিলো', exponent: 3 },
  { symbol: 'M', nameBn: 'মেগা', exponent: 6 },
  { symbol: 'G', nameBn: 'গিগা', exponent: 9 },
  { symbol: 'T', nameBn: 'টেরা', exponent: 12 },
  { symbol: 'P', nameBn: 'পেটা', exponent: 15 },
  { symbol: 'E', nameBn: 'এক্সা', exponent: 18 },
]

const L = {
  title: { bn: 'রাশির মাপনী', en: 'The Scale of Things' },
  value: { bn: 'মান', en: 'Value' },
  nearest: { bn: 'কাছাকাছি', en: 'Nearest' },
  prefix: { bn: 'উপসর্গ', en: 'Prefix' },
  hint: { bn: 'স্লাইডার সরিয়ে মাপনী ঘুরে দেখো', en: 'Move the slider to explore' },
} as const

type LabelKey = keyof typeof L

export default function LogScaleExplorer({
  language = 'BN',
}: RendererProps<Record<string, never>, Record<string, never>>) {
  const t = useCallback(
    (key: LabelKey) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )
  const num = useCallback(
    (value: number | string) =>
      language === 'BN' ? toBanglaDigits(Number(value), 'BN') : String(value),
    [language],
  )

  const [trackKey, setTrackKey] = useState(TRACKS[0].key)
  const track = TRACKS.find((x) => x.key === trackKey) ?? TRACKS[0]

  const { minExp, maxExp } = useMemo(() => {
    const exps = track.items.map((i) => Math.log10(i.value))
    return {
      minExp: Math.floor(Math.min(...exps)) - 1,
      maxExp: Math.ceil(Math.max(...exps)) + 1,
    }
  }, [track])

  const [exponent, setExponent] = useState(0)
  const clamped = Math.max(minExp, Math.min(maxExp, exponent))

  const toX = useCallback(
    (exp: number) =>
      PAD_X + ((exp - minExp) / (maxExp - minExp)) * (VIEW_W - PAD_X * 2),
    [minExp, maxExp],
  )

  const nearest = useMemo(() => {
    return track.items.reduce((best, item) =>
      Math.abs(Math.log10(item.value) - clamped) <
      Math.abs(Math.log10(best.value) - clamped)
        ? item
        : best,
    )
  }, [track, clamped])

  const prefix = useMemo(() => {
    return PREFIXES.reduce((best, p) =>
      Math.abs(p.exponent - clamped) < Math.abs(best.exponent - clamped) ? p : best,
    )
  }, [clamped])

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <div className="sim__tabs">
        {TRACKS.map((x) => (
          <button
            key={x.key}
            type="button"
            className={x.key === trackKey ? 'is-active' : ''}
            onClick={() => {
              setTrackKey(x.key)
              setExponent(0)
            }}
          >
            {language === 'BN' ? x.nameBn : x.nameEn}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="sim__svg"
        role="img"
        aria-label={t('title')}
      >
        <line
          x1={PAD_X}
          y1={150}
          x2={VIEW_W - PAD_X}
          y2={150}
          className="sim__datum"
        />

        {/* decade ticks */}
        {Array.from({ length: maxExp - minExp + 1 }, (_, i) => {
          const exp = minExp + i
          const major = exp % 5 === 0
          if (!major && maxExp - minExp > 30) return null
          return (
            <g key={exp}>
              <line
                x1={toX(exp)}
                y1={150}
                x2={toX(exp)}
                y2={150 + (major ? 12 : 6)}
                className="sim__tick"
              />
              {major && (
                <text
                  x={toX(exp)}
                  y={180}
                  className="sim__tickLabel"
                  textAnchor="middle"
                >
                  10{superscript(exp)}
                </text>
              )}
            </g>
          )
        })}

        {/* the objects from টেবিল ১.০২ */}
        {track.items.map((item, i) => {
          const x = toX(Math.log10(item.value))
          const above = i % 2 === 0
          const y = above ? 118 : 182
          const isNearest = item === nearest
          return (
            <g key={item.labelEn} className={isNearest ? 'is-match' : ''}>
              <line
                x1={x}
                y1={150}
                x2={x}
                y2={y + (above ? 10 : -10)}
                className={`sim__tick ${isNearest ? 'is-match' : ''}`}
              />
              <circle
                cx={x}
                cy={150}
                r={isNearest ? 6 : 4}
                className={`sim__dot ${isNearest ? 'is-match' : ''}`}
              />
              <text
                x={x}
                y={above ? y : y + 4}
                className={`sim__itemLabel ${isNearest ? 'is-match' : ''}`}
                textAnchor="middle"
              >
                {language === 'BN' ? item.labelBn : item.labelEn}
              </text>
            </g>
          )
        })}

        {/* the marker */}
        <g transform={`translate(${toX(clamped)} 0)`}>
          <line x1={0} y1={30} x2={0} y2={210} className="sim__marker" />
          <path d="M 0 26 l 8 -14 l -16 0 Z" className="sim__index" />
        </g>
      </svg>

      <input
        type="range"
        className="sim__rangeWide"
        min={minExp}
        max={maxExp}
        step={0.1}
        value={clamped}
        onChange={(e) => setExponent(Number(e.target.value))}
        aria-label={t('hint')}
      />

      <div className="sim__panel">
        <Readout
          label={t('value')}
          value={`10${superscript(Math.round(clamped * 10) / 10)} ${track.unit}`}
          emphasis
        />
        <Readout
          label={t('prefix')}
          value={
            prefix.symbol
              ? `${language === 'BN' ? prefix.nameBn : prefix.symbol} (${prefix.symbol}${track.unit})`
              : '—'
          }
        />
        <Readout
          label={t('nearest')}
          value={language === 'BN' ? nearest.labelBn : nearest.labelEn}
        />
      </div>

      <p className="sim__note">
        {t('hint')} — {num(track.items.length)}
        {language === 'BN' ? 'টি বস্তু' : ' objects'}
      </p>
    </figure>
  )
}

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '.': '·',
}

function superscript(value: number): string {
  return String(value)
    .split('')
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join('')
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
