import { useCallback, useState, type FormEvent } from 'react'
import { login, ApiError, type CurrentUser } from '../../lib/api'
import type { Language } from '../../registry/types'

/**
 * Sign-in form.
 *
 * There is no "remember me" and no token in localStorage: the session lives in
 * an httpOnly cookie the page cannot read, which is what keeps a cross-site
 * script from stealing it.
 */

const L = {
  title: { bn: 'সাইন ইন', en: 'Sign in' },
  email: { bn: 'ইমেইল', en: 'Email' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  submit: { bn: 'প্রবেশ করো', en: 'Sign in' },
  working: { bn: 'অপেক্ষা করো…', en: 'Signing in…' },
  offline: {
    bn: 'সার্ভারে পৌঁছানো যাচ্ছে না।',
    en: 'Could not reach the server.',
  },
} as const

interface Props {
  language?: Language
  onSignedIn: (user: CurrentUser) => void
}

export default function SignIn({ language = 'BN', onSignedIn }: Props) {
  const t = useCallback(
    (key: keyof typeof L) => (language === 'BN' ? L[key].bn : L[key].en),
    [language],
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      setBusy(true)
      setError(null)
      try {
        onSignedIn(await login(email, password))
      } catch (cause) {
        // Show the server's message verbatim. It deliberately does not say
        // whether the email exists, and paraphrasing risks leaking that.
        setError(cause instanceof ApiError ? cause.message : t('offline'))
      } finally {
        setBusy(false)
      }
    },
    [email, password, onSignedIn, t],
  )

  return (
    <form className="signin" onSubmit={onSubmit}>
      <h2 className="signin__title">{t('title')}</h2>

      <label className="signin__field">
        <span>{t('email')}</span>
        <input
          type="email"
          value={email}
          autoComplete="username"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="signin__field">
        <span>{t('password')}</span>
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && (
        <p className="signin__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || !email || !password}>
        {busy ? t('working') : t('submit')}
      </button>
    </form>
  )
}
