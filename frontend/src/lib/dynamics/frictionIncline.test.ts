import { describe, it, expect } from 'vitest'
import {
  staticCoefficientFromAngle,
  criticalAngle,
  staysStill,
  slideAcceleration,
  staticFrictionForce,
  kineticFrictionForce,
  G,
} from './frictionIncline'

/**
 * চিত্র ৩.১৮ (p. 91) gives the relationship μs = tan θc but no worked numeric
 * example — this is a "নিজে করো" investigation, not a solved problem, the same
 * situation as Chapter 2's inclined-plane investigation. The tests below check
 * the identity itself and the general physics, not a page-printed number that
 * does not exist.
 */

describe('staticCoefficientFromAngle / criticalAngle — μs = tan θc, p. 91', () => {
  it('are exact inverses of each other', () => {
    const mus = 0.4
    expect(staticCoefficientFromAngle(criticalAngle(mus))).toBeCloseTo(mus, 6)
  })

  it('a 45-degree critical angle gives μs = 1', () => {
    expect(staticCoefficientFromAngle(Math.PI / 4)).toBeCloseTo(1, 6)
  })

  it('a flat surface (0°) gives μs = 0', () => {
    expect(staticCoefficientFromAngle(0)).toBe(0)
  })

  it('rejects an angle at or past vertical', () => {
    expect(() => staticCoefficientFromAngle(Math.PI / 2)).toThrow()
    expect(() => staticCoefficientFromAngle(-0.1)).toThrow()
  })

  it('rejects a negative coefficient', () => {
    expect(() => criticalAngle(-0.1)).toThrow()
  })
})

describe('staysStill', () => {
  it('nothing slides on a perfectly flat surface, for any positive μs', () => {
    expect(staysStill(0, 0.01)).toBe(true)
    expect(staysStill(0, 5)).toBe(true)
  })

  it('a block with zero friction slides at any non-zero angle', () => {
    expect(staysStill(0.1, 0)).toBe(false)
  })

  it('agrees with the critical angle at the boundary', () => {
    const mus = 0.3
    const theta = criticalAngle(mus)
    expect(staysStill(theta, mus)).toBe(true) // exactly at the edge: just holds
    expect(staysStill(theta + 0.01, mus)).toBe(false) // past it: slides
    expect(staysStill(theta - 0.01, mus)).toBe(true) // before it: holds
  })
})

describe('slideAcceleration', () => {
  it('is zero right at the critical angle — sliding has not begun', () => {
    const mus = 0.5
    const theta = criticalAngle(mus)
    // Using the same coefficient for both, as the book treats μs ≈ μk loosely
    // at the point of first motion.
    expect(slideAcceleration(theta, mus)).toBeCloseTo(0, 2)
  })

  it('increases with steeper angle for fixed friction', () => {
    const shallow = slideAcceleration(0.3, 0.1)
    const steep = slideAcceleration(0.6, 0.1)
    expect(steep).toBeGreaterThan(shallow)
  })

  it('is g on a frictionless vertical drop', () => {
    expect(slideAcceleration(Math.PI / 2, 0)).toBeCloseTo(G, 6)
  })

  it('never goes negative even if friction would over-resist the model', () => {
    expect(slideAcceleration(0.05, 10)).toBe(0)
  })

  it('does not depend on mass — friction and gravity both scale with it', () => {
    // The function signature itself has no mass parameter, which is the point:
    // on a simple incline, acceleration under gravity plus Coulomb friction is
    // mass-independent because both driving and resisting forces are ∝ m.
    // (Function.length counts only parameters before the first one with a
    // default, so g's default excludes it from the count — 2, not 3.)
    expect(slideAcceleration.length).toBe(2) // (angle, coefficient) — no mass
  })
})

describe('staticFrictionForce — matches the driving force, capped at μs·N', () => {
  it('equals the driving force below the critical angle', () => {
    const mass = 2
    const mus = 0.5
    const theta = criticalAngle(mus) - 0.1
    const driving = mass * G * Math.sin(theta)
    expect(staticFrictionForce(mass, theta, mus)).toBeCloseTo(driving, 4)
  })

  it('is capped at μs·N once the driving force would exceed it', () => {
    const mass = 2
    const mus = 0.3
    const steepTheta = 1.4 // well past critical for this μs
    const maxStatic = mus * mass * G * Math.cos(steepTheta)
    expect(staticFrictionForce(mass, steepTheta, mus)).toBeCloseTo(maxStatic, 4)
  })

  it('is zero on a flat surface — nothing to resist', () => {
    expect(staticFrictionForce(5, 0, 0.4)).toBe(0)
  })
})

describe('kineticFrictionForce — fk = μk·N, p. 90', () => {
  it('matches μk·mg·cos θ directly', () => {
    const mass = 3
    const muk = 0.2
    const theta = 0.4
    expect(kineticFrictionForce(mass, theta, muk)).toBeCloseTo(
      muk * mass * G * Math.cos(theta),
      6,
    )
  })

  it('is zero for a frictionless surface', () => {
    expect(kineticFrictionForce(3, 0.4, 0)).toBe(0)
  })
})
