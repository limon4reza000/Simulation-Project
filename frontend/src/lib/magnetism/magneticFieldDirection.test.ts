import { describe, it, expect } from 'vitest'
import {
  fieldAroundStraightWire,
  solenoidPoleFace,
  reverseCurrent,
} from './magneticFieldDirection'

describe('fieldAroundStraightWire — right-hand grip rule, p. 333', () => {
  it('current up gives a counter-clockwise field (viewed from above)', () => {
    expect(fieldAroundStraightWire('up')).toBe('counterclockwise')
  })

  it('current down gives the reverse: clockwise', () => {
    expect(fieldAroundStraightWire('down')).toBe('clockwise')
  })

  it('reversing the current always reverses the field, as the book states explicitly', () => {
    const up = fieldAroundStraightWire('up')
    const down = fieldAroundStraightWire('down')
    expect(up).not.toBe(down)
  })
})

describe('solenoidPoleFace — grip rule applied to a loop, p. 334', () => {
  it('counter-clockwise winding (viewed from a face) makes that face the north pole', () => {
    expect(solenoidPoleFace('counterclockwise')).toBe('toward-viewer')
  })

  it('clockwise winding makes that face the south pole side', () => {
    expect(solenoidPoleFace('clockwise')).toBe('away-from-viewer')
  })
})

describe('reverseCurrent', () => {
  it('flips up to down and back', () => {
    expect(reverseCurrent('up')).toBe('down')
    expect(reverseCurrent(reverseCurrent('up'))).toBe('up')
  })
})
