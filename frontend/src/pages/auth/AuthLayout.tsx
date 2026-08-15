import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BackIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  FacebookMark,
  GoogleMark,
  AppleMark,
  MicrosoftMark,
} from './AuthIcons'
import type { Language } from '../../registry/types'
import './auth.css'

/**
 * Shell for the four authentication screens.
 *
 * A single centred column on a soft gradient: back button, centred heading,
 * icon-led fields, one primary action. The layout is mobile-first and simply
 * stays centred on wider screens rather than stretching, because a login form
 * gains nothing from being 1200px wide.
 */

interface Props {
  /**
   * Small role chip above the heading.
   *
   * The design gives both roles the same heading ("Welcome Back"), which on a
   * platform with separate student and teacher pages leaves you unable to tell
   * which one you are on. This restores that without disturbing the layout.
   */
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  error?: string | null
  /** Rendered under the primary button: the "already have an account" line. */
  switchLine?: ReactNode
  language?: Language
  /** Where the back arrow goes. Defaults to the student login. */
  backTo?: string
}

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  error,
  switchLine,
  language = 'BN',
  backTo,
}: Props) {
  const navigate = useNavigate()

  return (
    <div className="auth">
      <div className="auth__sheet">
        <button
          type="button"
          className="auth__back"
          aria-label={language === 'BN' ? 'পিছনে যাও' : 'Go back'}
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <BackIcon className="auth__backIcon" />
        </button>

        <header className="auth__head">
          {eyebrow && <p className="auth__eyebrow">{eyebrow}</p>}
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
        </header>

        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}

        {children}

        {switchLine && <p className="auth__switch">{switchLine}</p>}

        <SocialRow language={language} />

        <AuthLegal language={language} />
      </div>
    </div>
  )
}

/**
 * Field with a leading icon and a visually hidden label.
 *
 * The label is hidden, not omitted: the placeholder carries it visually, while
 * assistive technology still gets a proper name for the control. A placeholder
 * alone would leave the input unnamed.
 */
export function Field({
  label,
  icon,
  children,
  hint,
  trailing,
}: {
  label: string
  icon: ReactNode
  children: ReactNode
  hint?: string
  /** Decorative adornment on the right, e.g. a select's chevron. */
  trailing?: ReactNode
}) {
  return (
    <div className="auth__field">
      <label className="auth__label">
        <span className="auth__labelText">{label}</span>
        <span className="auth__control">
          <span className="auth__icon">{icon}</span>
          {children}
          {trailing && (
            <span className="auth__trailing" aria-hidden="true">
              {trailing}
            </span>
          )}
        </span>
      </label>
      {hint && <span className="auth__hint">{hint}</span>}
    </div>
  )
}

/**
 * Password field with a reveal toggle.
 *
 * The toggle is a real button with a changing accessible name, so it is
 * reachable by keyboard and announced correctly — an icon that only responds to
 * a mouse would lock out anyone typing a long password they cannot check.
 */
export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  language = 'BN',
  minLength,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete?: string
  language?: Language
  minLength?: number
  hint?: string
}) {
  const [visible, setVisible] = useState(false)
  const show = language === 'BN' ? 'পাসওয়ার্ড দেখাও' : 'Show password'
  const hide = language === 'BN' ? 'পাসওয়ার্ড লুকাও' : 'Hide password'

  return (
    <div className="auth__field">
      <label className="auth__label">
        <span className="auth__labelText">{label}</span>
        <span className="auth__control">
          <span className="auth__icon">
            <LockIcon />
          </span>
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required
            minLength={minLength}
            onChange={(e) => onChange(e.target.value)}
          />
        </span>
      </label>
      <button
        type="button"
        className="auth__reveal"
        aria-label={visible ? hide : show}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <EyeOffIcon className="auth__revealIcon" />
        ) : (
          <EyeIcon className="auth__revealIcon" />
        )}
      </button>
      {/*
        Shown once typing starts rather than always. A permanently visible hint
        put a gap between two fields that the rest of the form does not have,
        and the rule only becomes useful when there is a password to measure.
      */}
      {hint && value.length > 0 && <span className="auth__hint">{hint}</span>}
    </div>
  )
}

/**
 * Third-party sign-in.
 *
 * These providers are NOT connected — there is no OAuth client, no redirect
 * handler and no account-linking model. They are rendered because the design
 * calls for them, but each says so plainly when pressed rather than failing
 * silently. A button that looks like it works and does nothing is worse than
 * one that explains itself.
 */
function SocialRow({ language }: { language: Language }) {
  const [notice, setNotice] = useState<string | null>(null)

  const providers = [
    { key: 'Facebook', mark: <FacebookMark className="auth__socialMark" /> },
    { key: 'Google', mark: <GoogleMark className="auth__socialMark" /> },
    { key: 'Apple', mark: <AppleMark className="auth__socialMark" /> },
    { key: 'Microsoft', mark: <MicrosoftMark className="auth__socialMark" /> },
  ]

  const unavailable = (name: string) =>
    language === 'BN'
      ? `${name} দিয়ে লগইন এখনো চালু হয়নি — ইমেইল ব্যবহার করো।`
      : `${name} sign-in is not available yet — please use email.`

  return (
    <div className="auth__social">
      <div className="auth__or">
        <span>{language === 'BN' ? 'অথবা' : 'or'}</span>
      </div>

      <div className="auth__socialRow">
        {providers.map((p) => (
          <button
            key={p.key}
            type="button"
            className="auth__socialBtn"
            aria-label={
              language === 'BN'
                ? `${p.key} দিয়ে চালিয়ে যাও (এখনো চালু হয়নি)`
                : `Continue with ${p.key} (not available yet)`
            }
            onClick={() => setNotice(unavailable(p.key))}
          >
            {p.mark}
          </button>
        ))}
      </div>

      {notice && (
        <p className="auth__notice" role="status">
          {notice}
        </p>
      )}
    </div>
  )
}

/**
 * Legal line.
 *
 * Plain text, not links: there are no Terms or Privacy pages yet, and linking
 * to nothing on the screen where someone agrees to them is the worst place to
 * do it. Turn these into links the moment the documents exist.
 */
function AuthLegal({ language }: { language: Language }) {
  return (
    <p className="auth__legal">
      {language === 'BN' ? (
        <>
          এই প্ল্যাটফর্ম ব্যবহার করলে তুমি আমাদের{' '}
          <strong>শর্তাবলি</strong> ও <strong>গোপনীয়তা নীতি</strong> মেনে নিচ্ছ।
        </>
      ) : (
        <>
          By continuing you agree to our <strong>Terms of Service</strong> and{' '}
          <strong>Privacy Policy</strong>.
        </>
      )}
    </p>
  )
}

export function AuthLink({
  to,
  children,
  variant = 'primary',
}: {
  to: string
  children: ReactNode
  /** `cross-role` is the quieter student/teacher switch. */
  variant?: 'primary' | 'cross-role'
}) {
  return (
    <Link
      className={`auth__link ${variant === 'cross-role' ? 'auth__crossRole' : ''}`}
      to={to}
    >
      {children}
    </Link>
  )
}
