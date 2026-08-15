/**
 * Deriving velocity and acceleration graphs from a distance–time dataset.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), গতি ও লেখচিত্র
 * (Motion and Graphs), pp. 51–53, টেবিল ২.০১ and চিত্র ২.০৯.
 *
 * The book has no calculus available to it at this level, so its own method
 * (p. 52, চিত্র ২.০৯: "দূরত্ব-সময় থেকে বেগ-সময় ... বের করে") is the discrete
 * one used here: velocity between two consecutive readings is Δs/Δt, plotted
 * at the midpoint of their times; acceleration is then Δv/Δt between
 * consecutive derived velocities, plotted at the midpoint of *those* times.
 *
 * টেবিল ২.০১'s first dataset (p. 51) is s = t² exactly — t = 0,1,2,3,4,5 giving
 * s = 0,1,4,9,16,25. That is the fixture the tests check against, because this
 * midpoint method is exact for a quadratic: it recovers v = 2t and a = 2
 * without any rounding error, which is a genuine property of the method, not
 * a coincidence of the book's chosen numbers.
 */

function round(value: number, decimals = 6): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export interface Sample {
  t: number
  value: number
}

/**
 * Midpoint derivative: for each adjacent pair of samples, the average rate of
 * change over that interval, associated with the interval's midpoint time.
 * An n-point series produces n-1 derived points — one per gap, never one per
 * original sample, because a rate needs two readings to define it.
 */
export function midpointDerivative(samples: Sample[]): Sample[] {
  if (samples.length < 2) {
    throw new Error('need at least two samples to derive a rate')
  }
  const derived: Sample[] = []
  for (let i = 1; i < samples.length; i++) {
    const dt = samples[i].t - samples[i - 1].t
    if (dt <= 0) throw new Error('sample times must be strictly increasing')
    const rate = (samples[i].value - samples[i - 1].value) / dt
    derived.push({ t: round((samples[i].t + samples[i - 1].t) / 2), value: round(rate) })
  }
  return derived
}

/** Velocity samples derived from a distance–time dataset. */
export function deriveVelocity(distanceTime: Sample[]): Sample[] {
  return midpointDerivative(distanceTime)
}

/** Acceleration samples derived from the already-derived velocity samples. */
export function deriveAcceleration(distanceTime: Sample[]): Sample[] {
  return midpointDerivative(deriveVelocity(distanceTime))
}

/** Builds a distance–time series from parallel time and distance arrays. */
export function toSamples(times: number[], distances: number[]): Sample[] {
  if (times.length !== distances.length) {
    throw new Error('times and distances must have the same length')
  }
  return times.map((t, i) => ({ t, value: distances[i] }))
}

/** টেবিল ২.০১, first dataset (p. 51): uniformly accelerated, s = t². */
export const TABLE_2_01_SET_1: Sample[] = toSamples(
  [0, 1, 2, 3, 4, 5],
  [0, 1, 4, 9, 16, 25],
)

/** টেবিল ২.০১, second dataset (p. 51): s = 1.5·t². */
export const TABLE_2_01_SET_2: Sample[] = toSamples(
  [0, 2, 4, 6, 8, 10],
  [0, 6, 24, 54, 96, 150],
)
