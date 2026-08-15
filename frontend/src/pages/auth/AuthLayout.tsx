import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AuthIllustration from './AuthIllustration'
import type { Language } from '../../registry/types'

/**
 * Shell for the four authentication pages.
 *
 * A split card: a branded panel carrying the form, and a light panel carrying
 * the illustration. The divider is an SVG curve rather than a straight edge,
 * which is what gives the composition its shape at any width — a CSS
 * border-radius cannot make that sweep.
 *
 * The illustration panel is decorative, so it is the first thing dropped on
 * narrow screens: a student on a phone gets the form, full width, with no
 * horizontal scrolling and nothing important hidden.
 */

interface Props {
  title: string
  subtitle?: string
  brandLine: string
  children: ReactNode
  footer?: ReactNode
  error?: string | null
  /** Registration forms are taller and need the roomier column. */
  wide?: boolean
}

export function AuthLayout({
  title,
  subtitle,
  brandLine,
  children,
  footer,
  error,
  wide = false,
}: Props) {
  return (
    <div className="authpage">
      {/* Decorative dot grids, purely atmospheric. */}
      <span className="authdots authdots--tr" aria-hidden="true" />
      <span className="authdots authdots--bl" aria-hidden="true" />

      <div className={`authcard ${wide ? 'is-wide' : ''}`}>
        <section className="authcard__panel">
          {/* The curve lives behind the content and bleeds past the panel edge
              so it still reads as a sweep when the card is narrow.
              It deliberately keeps its width at the bottom: an earlier version
              tapered to nothing and the footer links spilled onto the white
              half of the card. */}
          <svg
            className="authcard__curve"
            viewBox="0 0 200 600"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="authCurveG" x1="0" y1="0" x2="0.6" y2="1">
                <stop offset="0" stopColor="var(--auth-brand-top)" />
                <stop offset="1" stopColor="var(--auth-brand-bottom)" />
              </linearGradient>
            </defs>
            <path
              d="M0 0 H152 C 126 150, 208 300, 158 442 C 140 522, 146 566, 144 600 H0 Z"
              fill="url(#authCurveG)"
            />
          </svg>

          <div className="authcard__content">
            <p className="authcard__brand">{brandLine}</p>
            <h1 className="authcard__title">{title}</h1>
            {subtitle && <p className="authcard__subtitle">{subtitle}</p>}

            {error && (
              <p className="authcard__error" role="alert">
                {error}
              </p>
            )}

            {children}

            {footer && <div className="authcard__footer">{footer}</div>}
          </div>
        </section>

        <aside className="authart" aria-hidden="true">
          <AuthIllustration />
        </aside>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
  hideLabel = false,
}: {
  label: string
  children: ReactNode
  hint?: string
  /**
   * Visually hides the label while keeping it for assistive technology.
   *
   * Used on the two-field login, where a placeholder is unambiguous. NOT used
   * on registration: with five fields, a placeholder that vanishes the moment
   * you type is a genuinely bad experience, and looking pretty is not worth
   * making someone guess what they already filled in.
   */
  hideLabel?: boolean
}) {
  return (
    <div className="authfield">
      <label className={`authfield__label ${hideLabel ? 'is-hidden' : ''}`}>
        <span>{label}</span>
        {children}
      </label>
      {hint && <span className="authfield__hint">{hint}</span>}
    </div>
  )
}

export function AuthSwitch({
  language,
  to,
  labelBn,
  labelEn,
  lead,
}: {
  language: Language
  to: string
  labelBn: string
  labelEn: string
  lead?: string
}) {
  return (
    <p className="authcard__switch">
      {lead && <span>{lead} </span>}
      <Link className="authcard__link" to={to}>
        {language === 'BN' ? labelBn : labelEn}
      </Link>
    </p>
  )
}
