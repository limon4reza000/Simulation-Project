import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  registerStudent,
  fetchEnrollableClasses,
  ApiError,
  type EnrollableClass,
} from '../../lib/api'
import { useAuth, homeRouteFor } from '../../auth/AuthContext'
import { AuthLayout, Field, PasswordField, AuthLink } from './AuthLayout'
import { MailIcon, UserIcon, ClassIcon, ChevronDownIcon } from './AuthIcons'
import type { Language } from '../../registry/types'

/**
 * Student registration.
 *
 * Class is required. The dropdown is populated from the server rather than
 * hard-coded, so the options can never drift from the classes that actually
 * exist — and the server validates the choice again regardless, because a
 * select element is not a security control.
 */

const T = {
  title: { bn: 'অ্যাকাউন্ট খোলো', en: 'Create Account' },
  subtitle: { bn: 'অ্যাকাউন্ট তৈরি করে শেখা শুরু করো', en: 'Create an account to start learning' },
  name: { bn: 'পুরো নাম', en: 'Full name' },
  classLabel: { bn: 'শ্রেণি', en: 'Class' },
  classPlaceholder: { bn: 'তোমার শ্রেণি বেছে নাও', en: 'Choose your class' },
  email: { bn: 'ইমেইল', en: 'Email Address' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  confirm: { bn: 'পাসওয়ার্ড আবার লিখো', en: 'Confirm password' },
  passwordHint: { bn: 'কমপক্ষে ৮ অক্ষর', en: 'At least 8 characters' },
  submit: { bn: 'অ্যাকাউন্ট তৈরি করো', en: 'Create Account' },
  working: { bn: 'তৈরি হচ্ছে…', en: 'Creating…' },
  mismatch: { bn: 'দুটি পাসওয়ার্ড মিলছে না', en: 'Passwords do not match' },
  needClass: { bn: 'শ্রেণি বেছে নাও', en: 'Please choose your class' },
  offline: { bn: 'সার্ভারে পৌঁছানো যাচ্ছে না।', en: 'Could not reach the server.' },
  haveAccount: { bn: 'সাইন ইন', en: 'Sign In' },
  teacher: { bn: 'আপনি কি শিক্ষক?', en: 'Are you a teacher?' },
} as const

export default function StudentRegisterPage({
  language = 'BN',
}: {
  language?: Language
}) {
  const t = (key: keyof typeof T) => (language === 'BN' ? T[key].bn : T[key].en)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [classes, setClasses] = useState<EnrollableClass[]>([])
  const [name, setName] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchEnrollableClasses(controller.signal)
      .then(setClasses)
      .catch(() => setClasses([]))
    return () => controller.abort()
  }, [])

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      // Checked here for a fast, friendly message; the server checks again.
      if (!classLevel) return setError(t('needClass'))
      if (password !== confirm) return setError(t('mismatch'))

      setBusy(true)
      setError(null)
      try {
        const user = await registerStudent({
          name,
          email,
          password,
          classLevel: Number(classLevel),
        })
        setUser(user)
        navigate(homeRouteFor(user), { replace: true })
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : t('offline'))
      } finally {
        setBusy(false)
      }
    },
    [name, email, password, confirm, classLevel, setUser, navigate],
  )

  return (
    <AuthLayout
      language={language}
      backTo="/login/student"
      eyebrow={language === 'BN' ? 'শিক্ষার্থী রেজিস্ট্রেশন' : 'Student sign up'}
      title={t('title')}
      subtitle={t('subtitle')}
      error={error}
      switchLine={
        <>
          {language === 'BN' ? 'অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
          <AuthLink to="/login/student">{t('haveAccount')}</AuthLink>
          <br />
          <AuthLink to="/register/teacher">{t('teacher')}</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="auth__form">
        <Field label={t('name')} icon={<UserIcon />}>
          <input
            type="text"
            value={name}
            placeholder={t('name')}
            autoComplete="name"
            required
            minLength={2}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        {/* Required. The server validates it again against published classes. */}
        <Field
          label={t('classLabel')}
          icon={<ClassIcon />}
          trailing={<ChevronDownIcon />}
        >
          <select
            value={classLevel}
            required
            aria-label={t('classLabel')}
            /* Greyed until chosen, so an unpicked class does not read as an
               answer the student has already given. */
            className={classLevel ? '' : 'is-placeholder'}
            onChange={(e) => setClassLevel(e.target.value)}
          >
            <option value="">{t('classPlaceholder')}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.level}>
                {language === 'BN' ? cls.nameBn : cls.nameEn}
              </option>
            ))}
          </select>
        </Field>

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
          autoComplete="new-password"
          minLength={8}
          onChange={setPassword}
          hint={t('passwordHint')}
        />

        <PasswordField
          label={t('confirm')}
          language={language}
          value={confirm}
          placeholder={t('confirm')}
          autoComplete="new-password"
          onChange={setConfirm}
        />

        <button type="submit" className="auth__primary" disabled={busy}>
          {busy ? t('working') : t('submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
