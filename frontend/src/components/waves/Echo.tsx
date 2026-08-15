import { useCallback, useMemo, useState } from 'react'
import { roundTripTime, isEchoAudible, minimumEchoDistance } from '../../lib/waves/echo'
import { toBanglaDigits } from '../instruments/VernierCaliper'
import type { RendererProps } from '../../registry/types'

/**
 * SIM_ECHO — প্রতিধ্বনি, চিত্র ৭.১৬–৭.১৭
 *
 * Digitises §৭.৩.১ (pp. 201-202): a sound source at an adjustable distance
 * from a reflecting wall, live round-trip time and a clear audible/not
 * verdict against the book's own 0.1 s discrimination threshold.
 */

interface Config {
  maxDistanceM?: number
  speedMs?: number
}

interface Params {
  distanceM?: number
}

const L = {
  title: { bn: 'প্রতিধ্বনি', en: 'Echo' },
  distance: { bn: 'দেয়াল থেকে দূরত্ব (d)', en: 'Distance to wall (d)' },
  roundTrip: { bn: 'যাওয়া-আসার সময়', en: 'Round-trip time' },
  minDistance: { bn: 'সর্বনিম্ন দূরত্ব (প্রতিধ্বনি শোনার জন্য)', en: 'Minimum distance for an audible echo' },
  status: { bn: 'অবস্থা', en: 'Status' },
  audible: { bn: 'প্রতিধ্বনি শোনা যাবে', en: 'Echo will be heard' },
  notAudible: { bn: 'প্রতিধ্বনি আলাদা করে শোনা যাবে না', en: 'Echo will not be distinguishable' },
  note: {
    bn: 'কান একটি শব্দকে প্রায় ০.১ সেকেন্ড ধরে রাখে — তাই যাওয়া-আসার সময় অন্তত ০.১ সেকেন্ড না হলে প্রতিধ্বনি মূল শব্দ থেকে আলাদা করে শোনা যায় না।',
    en: 'The ear holds onto a sound for about 0.1 s — so unless the round trip takes at least that long, the echo cannot be heard as separate from the original.',
  },
} as const

type LabelKey = keyof typeof L

export default function Echo({
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

  const maxDistanceM = cfg.maxDistanceM ?? 50
  const speedMs = cfg.speedMs ?? 330

  const [distance, setDistance] = useState(params.distanceM ?? 20)
  const [reported, setReported] = useState(false)

  const roundTrip = useMemo(() => roundTripTime(distance, speedMs), [distance, speedMs])
  const audible = useMemo(() => isEchoAudible(distance, speedMs), [distance, speedMs])
  const minDistance = useMemo(() => minimumEchoDistance(speedMs), [speedMs])

  const report = useCallback(
    (nextDistance: number) => {
      if (!reported) {
        setReported(true)
        onActivity?.({
          activityType: 'ECHO_TESTED',
          metadata: { distanceM: nextDistance, roundTripS: roundTrip, audible },
          occurredAt: new Date().toISOString(),
        })
      }
    },
    [reported, roundTrip, audible, onActivity],
  )

  const trackW = 700
  const sourceX = 40
  const wallX = sourceX + Math.min(1, distance / maxDistanceM) * trackW

  return (
    <figure className="sim">
      <figcaption className="sim__title">{t('title')}</figcaption>

      <svg viewBox="0 0 800 140" className="sim__svg" role="img" aria-label={t('title')}>
        <line x1={sourceX} y1={70} x2={wallX} y2={70} className="sim__datum" />
        <circle cx={sourceX} cy={70} r={10} className="sim__dot is-match" />
        <rect x={wallX} y={20} width={14} height={100} className="sim__object" />
      </svg>

      <label className="sim__control">
        {t('distance')} (m)
        <input
          type="range"
          min={1}
          max={maxDistanceM}
          step={0.25}
          value={distance}
          onChange={(e) => {
            const v = Number(e.target.value)
            setDistance(v)
            report(v)
          }}
        />
      </label>

      <div className="sim__panel">
        <Readout label={t('roundTrip')} value={`${num(roundTrip.toFixed(3))} s`} />
        <Readout label={t('minDistance')} value={`${num(minDistance.toFixed(1))} m`} />
        <Readout label={t('status')} value={audible ? t('audible') : t('notAudible')} emphasis />
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
