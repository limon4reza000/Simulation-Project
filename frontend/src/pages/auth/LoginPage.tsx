import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, ApiError } from '../../lib/api'
import { useAuth, homeRouteFor } from '../../auth/AuthContext'
import { AuthLayout, Field, AuthSwitch } from './AuthLayout'
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
    title: { bn: 'শিক্ষার্থী লগইন', en: 'Student login' },
    subtitle: {
      bn: 'তোমার অ্যাকাউন্টে প্রবেশ করে পড়া শুরু করো',
      en: 'Sign in to continue learning',
    },
    registerTo: '/register/student',
    registerLabel: { bn: 'রেজিস্ট্রেশন করো', en: 'Create your account' },
    otherTo: '/login/teacher',
    otherLabel: { bn: 'আপনি কি শিক্ষক?', en: 'Are you a teacher?' },
  },
  teacher: {
    title: { bn: 'শিক্ষক লগইন', en: 'Teacher login' },
    subtitle: {
      bn: 'আপনার ক্লাস ও শিক্ষার্থীদের দেখতে প্রবেশ করুন',
      en: 'Sign in to see your classes and students',
    },
    registerTo: '/register/teacher',
    registerLabel: { bn: 'রেজিস্ট্রেশন করুন', en: 'Create your account' },
    otherTo: '/login/student',
    otherLabel: { bn: 'আপনি কি শিক্ষার্থী?', en: 'Are you a student?' },
  },
} as const

const FORM = {
  email: { bn: 'ইমেইল', en: 'Email' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  submit: { bn: 'প্রবেশ করো', en: 'Sign in' },
  working: { bn: 'অপেক্ষা করো…', en: 'Signing in…' },
  offline: { bn: 'সার্ভারে পৌঁছানো যাচ্ছে না।', en: 'Could not reach the server.' },
  remember: { bn: 'আমাকে মনে রেখো', en: 'Remember me' },
  brand: { bn: 'সিমুলেশন ল্যাব', en: 'SIMULATION LAB' },
  noAccount: { bn: 'অ্যাকাউন্ট নেই?', en: "Don't have an account?" },
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
      brandLine={c(FORM.brand)}
      title={c(copy.title)}
      subtitle={c(copy.subtitle)}
      error={error}
      footer={
        <>
          <AuthSwitch
            language={language}
            lead={c(FORM.noAccount)}
            to={copy.registerTo}
            labelBn={copy.registerLabel.bn}
            labelEn={copy.registerLabel.en}
          />
          <AuthSwitch
            language={language}
            to={copy.otherTo}
            labelBn={copy.otherLabel.bn}
            labelEn={copy.otherLabel.en}
          />
        </>
      }
    >
      <form onSubmit={onSubmit} className="authform">
        <Field label={t('email')} hideLabel>
          <input
            type="email"
            value={email}
            placeholder={t('email')}
            autoComplete="username"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label={t('password')} hideLabel>
          <input
            type="password"
            value={password}
            placeholder={t('password')}
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {/* Backed by a real, longer session lifetime — not decoration. */}
        <label className="authremember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>{t('remember')}</span>
        </label>

        <button type="submit" disabled={busy || !email || !password}>
          {busy ? t('working') : t('submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
