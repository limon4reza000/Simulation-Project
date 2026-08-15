import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, ApiError } from '../../lib/api'
import { useAuth, homeRouteFor } from '../../auth/AuthContext'
import { AuthLayout, Field, PasswordField, AuthLink } from './AuthLayout'
import { MailIcon } from './AuthIcons'
import type { Language } from '../../registry/types'

/**
 * Login, rendered at two routes with different copy.
 *
 * There is one login endpoint, because the role is a property of the account
 * and not of the form. A teacher who signs in through the student page still
 * lands on the teacher dashboard — the server decides, and the redirect follows
 * the server's answer. Splitting the endpoint would mean trusting the page to
 * say who someone is, which is the mistake this whole design avoids.
 */

const COPY = {
  student: {
    eyebrow: { bn: 'শিক্ষার্থী লগইন', en: 'Student sign in' },
    title: { bn: 'আবার স্বাগতম', en: 'Welcome Back' },
    subtitle: {
      bn: 'ইমেইল দিয়ে প্রবেশ করে তোমার পাঠ, অনুশীলন ও অগ্রগতি দেখো।',
      en: 'Sign in with your email to reach your lessons, practice and progress.',
    },
    registerTo: '/register/student',
    registerLabel: { bn: 'সাইন আপ', en: 'Sign Up' },
    prompt: { bn: 'অ্যাকাউন্ট নেই?', en: "Don't have an account?" },
    otherTo: '/login/teacher',
    otherLabel: { bn: 'শিক্ষক হিসেবে প্রবেশ করুন', en: 'Sign in as a teacher' },
  },
  teacher: {
    eyebrow: { bn: 'শিক্ষক লগইন', en: 'Teacher sign in' },
    title: { bn: 'আবার স্বাগতম', en: 'Welcome Back' },
    subtitle: {
      bn: 'ইমেইল দিয়ে প্রবেশ করে আপনার ক্লাস ও শিক্ষার্থীদের দেখুন।',
      en: 'Sign in with your email to see your classes and students.',
    },
    registerTo: '/register/teacher',
    registerLabel: { bn: 'সাইন আপ', en: 'Sign Up' },
    prompt: { bn: 'অ্যাকাউন্ট নেই?', en: "Don't have an account?" },
    otherTo: '/login/student',
    otherLabel: { bn: 'শিক্ষার্থী হিসেবে প্রবেশ করো', en: 'Sign in as a student' },
  },
} as const

const FORM = {
  email: { bn: 'ইমেইল', en: 'Email Address' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  submit: { bn: 'লগ ইন', en: 'Log In' },
  working: { bn: 'অপেক্ষা করো…', en: 'Signing in…' },
  offline: { bn: 'সার্ভারে পৌঁছানো যাচ্ছে না।', en: 'Could not reach the server.' },
  remember: { bn: 'আমাকে মনে রেখো', en: 'Remember me' },
  forgot: { bn: 'পাসওয়ার্ড ভুলে গেছ?', en: 'Forgot Password' },
  forgotHelp: {
    bn: 'পাসওয়ার্ড রিসেট এখনো চালু হয়নি। তোমার শিক্ষক বা প্রশাসকের সাথে যোগাযোগ করো।',
    en: 'Password reset is not available yet. Please ask your teacher or an administrator.',
  },
} as const

interface Props {
  variant: 'student' | 'teacher'
  language?: Language
}

export default function LoginPage({ variant, language = 'BN' }: Props) {
  const copy = COPY[variant]
  const t = (key: keyof typeof FORM) =>
    language === 'BN' ? FORM[key].bn : FORM[key].en
  const c = (pair: { bn: string; en: string }) =>
    language === 'BN' ? pair.bn : pair.en

  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotNotice, setForgotNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      setBusy(true)
      setError(null)
      try {
        const user = await login(email, password, rememberMe)
        setUser(user)
        // The role decides the destination, not the page they used.
        navigate(location.state?.from ?? homeRouteFor(user), { replace: true })
      } catch (cause) {
        // Show the server's wording: it deliberately does not reveal whether
        // the email exists, and paraphrasing risks leaking that.
        setError(cause instanceof ApiError ? cause.message : t('offline'))
      } finally {
        setBusy(false)
      }
    },
    [email, password, rememberMe, setUser, navigate, location.state],
  )

  return (
    <AuthLayout
      language={language}
      backTo={copy.otherTo}
      eyebrow={c(copy.eyebrow)}
      title={c(copy.title)}
      subtitle={c(copy.subtitle)}
      error={error}
      switchLine={
        <>
          {c(copy.prompt)}{' '}
          <AuthLink to={copy.registerTo}>{c(copy.registerLabel)}</AuthLink>
          <br />
          <AuthLink to={copy.otherTo}>{c(copy.otherLabel)}</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="auth__form">
        <Field label={t('email')} icon={<MailIcon />}>
          <input
            type="email"
            value={email}
            placeholder={t('email')}
            autoComplete="username"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <PasswordField
          label={t('password')}
          language={language}
          value={password}
          placeholder={t('password')}
          onChange={setPassword}
        />

        <div className="auth__row">
          {/* Backed by a real, longer session lifetime — not decoration. */}
          <label className="auth__remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>{t('remember')}</span>
          </label>

          {/*
            No reset flow exists. Rather than a link to nowhere, this states
            what someone locked out can actually do today.
          */}
          <button
            type="button"
            className="auth__forgot"
            onClick={() => setForgotNotice(t('forgotHelp'))}
          >
            {t('forgot')}
          </button>
        </div>

        {forgotNotice && (
          <p className="auth__notice" role="status">
            {forgotNotice}
          </p>
        )}

        <button
          type="submit"
          className="auth__primary"
          disabled={busy || !email || !password}
        >
          {busy ? t('working') : t('submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
