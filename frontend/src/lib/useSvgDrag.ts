import { useCallback, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'

export interface SvgPoint {
  x: number
  y: number
}

export interface SvgViewBox {
  width: number
  height: number
}

export interface SvgDragCallbacks {
  /** Fired on pointer down, before any movement. */
  onStart?: (point: SvgPoint) => void
  onMove: (point: SvgPoint) => void
  onEnd?: () => void
}

/**
 * Maps pointer drags onto SVG user-space coordinates.
 *
 * Pointer events (rather than mouse events) mean one code path serves mouse,
 * touch and stylus — which matters, because the target device for this platform
 * is a low-end Android phone, not a desktop.
 *
 * Both axes are reported so the same hook drives a linear drag (the caliper's
 * sliding jaw) and a rotational one (the screw gauge's thimble).
 */
export function useSvgDrag(
  svgRef: RefObject<SVGSVGElement | null>,
  viewBox: SvgViewBox,
  callbacks: SvgDragCallbacks,
) {
  const [dragging, setDragging] = useState(false)
  const { onStart, onMove, onEnd } = callbacks

  const toSvg = useCallback(
    (clientX: number, clientY: number): SvgPoint => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
      return {
        x: ((clientX - rect.left) / rect.width) * viewBox.width,
        y: ((clientY - rect.top) / rect.height) * viewBox.height,
      }
    },
    [svgRef, viewBox.width, viewBox.height],
  )

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<SVGElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
      const point = toSvg(event.clientX, event.clientY)
      if (onStart) onStart(point)
      else onMove(point)
    },
    [onMove, onStart, toSvg],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<SVGElement>) => {
      if (!dragging) return
      onMove(toSvg(event.clientX, event.clientY))
    },
    [dragging, onMove, toSvg],
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<SVGElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      setDragging(false)
      onEnd?.()
    },
    [onEnd],
  )

  return {
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
