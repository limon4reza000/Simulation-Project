import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerTeacher, ApiError } from '../../lib/api'
import { useAuth, homeRouteFor } from '../../auth/AuthContext'
import { AuthLayout, Field, AuthSwitch } from './AuthLayout'
import type { Language } from '../../registry/types'

/**
 * Teacher registration.
 *
 * No class field: a teacher is not enrolled in one. Which classes and subjects
 * they teach comes from TeacherAssignment, set by an administrator — a teacher
 * cannot grant themselves access to a class by typing it here.
 */

const T = {
  title: { bn: 'শিক্ষক রেজিস্ট্রেশন', en: 'Teacher registration' },
  subtitle: {
    bn: 'অ্যাকাউন্ট তৈরি করে আপনার ক্লাস পরিচালনা করুন',
    en: 'Create an account to manage your classes',
  },
  name: { bn: 'পুরো নাম', en: 'Full name' },
  institution: { bn: 'প্রতিষ্ঠান (ঐচ্ছিক)', en: 'Institution (optional)' },
  email: { bn: 'ইমেইল', en: 'Email' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  confirm: { bn: 'পাসওয়ার্ড আবার লিখুন', en: 'Confirm password' },
  passwordHint: { bn: 'কমপক্ষে ৮ অক্ষর', en: 'At least 8 characters' },
  submit: { bn: 'অ্যাকাউন্ট তৈরি করুন', en: 'Create account' },
  working: { bn: 'তৈরি হচ্ছে…', en: 'Creating…' },
  mismatch: { bn: 'দুটি পাসওয়ার্ড মিলছে না', en: 'Passwords do not match' },
  offline: { bn: 'সার্ভারে পৌঁছানো যাচ্ছে না।', en: 'Could not reach the server.' },
  assignmentNote: {
    bn: 'আপনার ক্লাস প্রশাসক নির্ধারণ করবেন।',
    en: 'An administrator assigns your classes after registration.',
  },
  haveAccount: { bn: 'লগইন করুন', en: 'Sign in' },
  student: { bn: 'আপনি কি শিক্ষার্থী?', en: 'Are you a student?' },
} as const

export default function TeacherRegisterPage({
  language = 'BN',
}: {
  language?: Language
}) {
  const t = (key: keyof typeof T) => (language === 'BN' ? T[key].bn : T[key].en)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      if (password !== confirm) return setError(t('mismatch'))

      setBusy(true)
      setError(null)
      try {
        const user = await registerTeacher({
          name,
          email,
          password,
          institution: institution.trim() || undefined,
        })
        setUser(user)
        navigate(homeRouteFor(user), { replace: true })
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : t('offline'))
      } finally {
        setBusy(false)
      }
    },
    [name, institution, email, password, confirm, setUser, navigate],
  )

  return (
    <AuthLayout
      wide
      brandLine={language === 'BN' ? 'সিমুলেশন ল্যাব' : 'SIMULATION LAB'}
      title={t('title')}
      subtitle={t('subtitle')}
      error={error}
      footer={
        <>
          <AuthSwitch
            language={language}
            lead={language === 'BN' ? 'অ্যাকাউন্ট আছে?' : 'Already have an account?'}
            to="/login/teacher"
            labelBn={T.haveAccount.bn}
            labelEn={T.haveAccount.en}
          />
          <AuthSwitch
            language={language}
            to="/register/student"
            labelBn={T.student.bn}
            labelEn={T.student.en}
          />
        </>
      }
    >
      <form onSubmit={onSubmit} className="authform">
        <Field label={t('name')}>
          <input
            type="text"
            value={name}
            autoComplete="name"
            required
            minLength={2}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label={t('institution')} hint={t('assignmentNote')}>
          <input
            type="text"
            value={institution}
            autoComplete="organization"
            onChange={(e) => setInstitution(e.target.value)}
          />
        </Field>

        <Field label={t('email')}>
          <input
            type="email"
            value={email}
            autoComplete="username"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label={t('password')} hint={t('passwordHint')}>
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            required
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label={t('confirm')}>
          <input
            type="password"
            value={confirm}
            autoComplete="new-password"
            required
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <button type="submit" disabled={busy}>
          {busy ? t('working') : t('submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
