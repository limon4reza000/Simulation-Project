/**
 * Distance travelled along a path vs. straight-line displacement.
 *
 * Source: মাধ্যমিক পদার্থবিজ্ঞান, শ্রেণি ৯–১০ (NCTB, 2026), §২.৪
 * দূরত্ব ও সরণ (Distance and Displacement), pp. 39, চিত্র ২.০৪.
 *
 * The book's own worked figures (p. 39): a winding path where the distance
 * travelled to point B is 4 km, the displacement A→B is 3 km, and continuing
 * to point C makes the total distance 6 km while the displacement A→C is
 * 1.5 km — larger distance travelled, smaller net displacement. Those two
 * pairs are the test fixture below.
 *
 * A path here is a polyline: an ordered list of waypoints. Distance is the
 * cumulative length walked along its segments; displacement is the straight
 * line from the start to the current point. No React — pure geometry, reused
 * by the renderer and directly testable against the book's own numbers.
 */

export interface Point {
  x: number
  y: number
}

export interface DisplacementResult {
  dx: number
  dy: number
  /** Straight-line distance from the start point, i.e. |displacement|. */
  magnitude: number
  /** Direction of the displacement vector, degrees, 0 = along +x, CCW positive. */
  angleDeg: number
}

function round(value: number, decimals = 4): number {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

function segmentLength(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Cumulative arc length at each vertex of the path, starting at 0 for the
 * first point. `cumulativeLength(path)[i]` is the total distance travelled by
 * the time the walker reaches `path[i]`.
 */
export function cumulativeLength(path: Point[]): number[] {
  if (path.length === 0) return []
  const totals = [0]
  for (let i = 1; i < path.length; i++) {
    totals.push(totals[i - 1] + segmentLength(path[i - 1], path[i]))
  }
  return totals
}

export function totalLength(path: Point[]): number {
  const totals = cumulativeLength(path)
  return round(totals[totals.length - 1] ?? 0)
}

/**
 * The point reached after walking `distance` along the path from its start,
 * clamped to the path's own endpoints. Linear interpolation within whichever
 * segment contains that distance.
 */
export function pointAtDistance(path: Point[], distance: number): Point {
  if (path.length === 0) throw new Error('path must have at least one point')
  if (path.length === 1) return path[0]

  const totals = cumulativeLength(path)
  const total = totals[totals.length - 1]
  const target = Math.min(Math.max(distance, 0), total)

  for (let i = 1; i < path.length; i++) {
    if (target <= totals[i]) {
      const segStart = totals[i - 1]
      const segLen = totals[i] - segStart
      const fraction = segLen === 0 ? 0 : (target - segStart) / segLen
      return {
        x: round(path[i - 1].x + (path[i].x - path[i - 1].x) * fraction),
        y: round(path[i - 1].y + (path[i].y - path[i - 1].y) * fraction),
      }
    }
  }
  return path[path.length - 1]
}

/**
 * Displacement from the path's start to a given current point — a vector, as
 * the book insists (p. 39): magnitude and direction both matter.
 */
export function displacementFrom(start: Point, current: Point): DisplacementResult {
  const dx = round(current.x - start.x)
  const dy = round(current.y - start.y)
  return {
    dx,
    dy,
    magnitude: round(Math.hypot(dx, dy)),
    angleDeg: round((Math.atan2(-dy, dx) * 180) / Math.PI),
  }
}

/**
 * Convenience: distance travelled and displacement together, at a given
 * distance walked along the path. What the renderer actually needs each frame.
 */
export function stateAtDistance(path: Point[], distance: number) {
  const point = pointAtDistance(path, distance)
  const total = totalLength(path)
  const travelled = round(Math.min(Math.max(distance, 0), total))
  return {
    point,
    distanceTravelled: travelled,
    displacement: displacementFrom(path[0], point),
  }
}
