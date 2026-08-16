// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { componentRegistry, resolveRenderer } from './componentRegistry'
import LessonRenderer from '../components/LessonRenderer'
import { chapter01Lessons } from '../data/chapter01'

afterEach(cleanup)

describe('component registry', () => {
  it('resolves every renderer type used by seeded Chapter 1 content', () => {
    // Guards the contract between the database `type` column and this map.
    // A rename on either side breaks a published lesson; this catches it here
    // rather than as a blank component in front of a student.
    const used = chapter01Lessons
      .flatMap((lesson) => lesson.components)
      .map((component) => component.rendererType)
      .filter((type): type is string => Boolean(type))
      // SIM_PENDULUM is intentionally unregistered — it is the fixture for the
      // graceful-degradation case below.
      .filter((type) => type !== 'SIM_PENDULUM')

    expect(used.length).toBeGreaterThan(0)
    for (const type of used) {
      expect(resolveRenderer(type), `unregistered renderer: ${type}`).toBeTypeOf(
        'function',
      )
    }
  })

  it('returns undefined rather than throwing for unknown types', () => {
    expect(resolveRenderer('SIM_DOES_NOT_EXIST')).toBeUndefined()
    expect(resolveRenderer(undefined)).toBeUndefined()
  })

  it('exposes the registered artefacts', () => {
    expect(Object.keys(componentRegistry).sort()).toEqual([
      'QUIZ_RUNNER',
      'SIM_ARCHIMEDES',
      'SIM_CALORIMETRY',
      'SIM_CAPACITOR_ENERGY',
      'SIM_COLLISION',
      'SIM_COULOMBS_LAW',
      'SIM_CRITICAL_ANGLE',
      'SIM_ECHO',
      'SIM_ELECTRIC_FIELD',
      'SIM_ELECTRON_TRANSFER',
      'SIM_ENERGY_CONVERSION',
      'SIM_ERROR_PROPAGATION',
      'SIM_FREE_FALL',
      'SIM_FRICTION_INCLINE',
      'SIM_HEATING_CURVE',
      'SIM_HOOKES_LAW',
      'SIM_INCLINED_PLANE',
      'SIM_LAW_OF_REFLECTION',
      'SIM_LENS_IMAGE',
      'SIM_LENS_POWER',
      'SIM_LIQUID_PRESSURE',
      'SIM_MIRROR_FORMULA',
      'SIM_NEWTONS_SECOND_LAW',
      'SIM_PENDULUM_ENERGY',
      'SIM_PENDULUM_PERIOD',
      'SIM_PLANE_MIRROR_IMAGE',
      'SIM_POWER_EFFICIENCY',
      'SIM_PRESSURE',
      'SIM_SCREW_GAUGE',
      'SIM_SNELLS_LAW',
      'SIM_SOUND_SPEED',
      'SIM_SPHERICAL_MIRROR',
      'SIM_TEMPERATURE_SCALES',
      'SIM_THERMAL_EXPANSION',
      'SIM_VERNIER_CALIPER',
      'SIM_WAVE_PROPERTIES',
      'SIM_WORK',
      'VIZ_DISTANCE_DISPLACEMENT',
      'VIZ_FORCE_BALANCE',
      'VIZ_LOG_SCALE_EXPLORER',
      'VIZ_MOTION_GRAPHER',
    ])
  })
})

describe('LessonRenderer', () => {
  const vernierLesson = chapter01Lessons.find((l) => l.id === 2)!
  const errorLesson = chapter01Lessons.find((l) => l.id === 4)!
  const brokenLesson = chapter01Lessons.find((l) => l.id === 5)!

  it('renders the caliper with the configured reading (24.40 mm)', () => {
    render(<LessonRenderer lesson={vernierLesson} language="BN" />)
    expect(screen.getAllByText('24.40 mm').length).toBeGreaterThan(0)
  })

  it('cites the textbook page for each component', () => {
    render(<LessonRenderer lesson={vernierLesson} language="BN" />)
    expect(screen.getAllByText(/পাঠ্যবই পৃষ্ঠা/).length).toBeGreaterThan(0)
  })

  it('switches language for titles and labels', () => {
    const { unmount } = render(
      <LessonRenderer lesson={vernierLesson} language="EN" />,
    )
    // The lesson heading plus one caption per caliper instance.
    expect(screen.getAllByText('Vernier Calipers').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Main scale reading M').length).toBe(1)
    unmount()

    render(<LessonRenderer lesson={vernierLesson} language="BN" />)
    expect(screen.getAllByText('ভার্নিয়ার ক্যালিপার্স').length).toBeGreaterThan(1)
    expect(screen.getAllByText('প্রধান স্কেল পাঠ M').length).toBe(1)
  })

  it('reproduces the p. 28 worked example on first render', () => {
    render(<LessonRenderer lesson={errorLesson} language="EN" />)
    // Nominal 200 cm³ with a relative error of 29.94 % — the book's ≅ 30 %.
    expect(screen.getByText('200 cm³')).toBeDefined()
    expect(screen.getByText('29.94 %')).toBeDefined()
  })

  it('mounts the screw gauge with the p. 22 least count of 0.01 mm', () => {
    const gaugeLesson = chapter01Lessons.find((l) => l.id === 3)!
    render(<LessonRenderer lesson={gaugeLesson} language="EN" />)
    expect(screen.getAllByText('0.01 mm').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2.53 mm').length).toBeGreaterThan(0)
  })

  it('mounts the log-scale explorer with all three টেবিল ১.০২ tracks', () => {
    const scaleLesson = chapter01Lessons.find((l) => l.id === 1)!
    render(<LessonRenderer lesson={scaleLesson} language="EN" />)
    for (const track of ['Distance', 'Mass', 'Time']) {
      expect(screen.getByText(track)).toBeDefined()
    }
  })

  it('never emits a negative SVG width at any measurable length', () => {
    // Regression: the screw gauge's spindle is drawn between the anvil and the
    // sleeve, and its width was computed from constants that could not fit the
    // full 12 mm range. Past ~3 mm the width went negative, SVG rejected the
    // rect, and the spindle silently vanished. Browsers report this only as a
    // console error, so nothing in the suite caught it — this does.
    for (const objectLength of [0, 0.5, 2.53, 6, 9.99, 12]) {
      const { container, unmount } = render(
        <componentRegistry.SIM_SCREW_GAUGE
          config={{ maxLengthMm: 12 }}
          parameters={{ pitch: 1, circularDivisions: 100, objectLength }}
          language="BN"
        />,
      )
      for (const rect of Array.from(container.querySelectorAll('rect'))) {
        const width = Number(rect.getAttribute('width'))
        expect(
          width >= 0,
          `negative rect width ${width} at objectLength=${objectLength}`,
        ).toBe(true)
      }
      unmount()
    }
  })

  it('renders every registered type without throwing', () => {
    // Cheap smoke test over the whole registry: a renderer that crashes on
    // empty config would otherwise only surface in front of a student.
    for (const [type, Renderer] of Object.entries(componentRegistry)) {
      const { unmount } = render(
        <Renderer config={{}} parameters={{}} language="BN" />,
      )
      expect(document.body.textContent, type).toBeTruthy()
      unmount()
    }
  })

  it('degrades in place when a component type is not registered', () => {
    render(<LessonRenderer lesson={brokenLesson} language="EN" />)
    expect(screen.getByText('SIM_PENDULUM')).toBeDefined()
    expect(
      screen.getByText('This component is not registered yet'),
    ).toBeDefined()
  })
})
