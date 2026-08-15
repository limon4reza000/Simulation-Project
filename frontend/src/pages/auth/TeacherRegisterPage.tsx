import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerTeacher, ApiError } from '../../lib/api'
import { useAuth, homeRouteFor } from '../../auth/AuthContext'
import { AuthLayout, Field, PasswordField, AuthLink } from './AuthLayout'
import { MailIcon, UserIcon, BuildingIcon } from './AuthIcons'
import type { Language } from '../../registry/types'

/**
 * Teacher registration.
 *
 * No class field: a teacher is not enrolled in one. Which classes and subjects
 * they teach comes from TeacherAssignment, set by an administrator — a teacher
 * cannot grant themselves access to a class by typing it here.
 */

const T = {
  title: { bn: 'শিক্ষক অ্যাকাউন্ট', en: 'Create Account' },
  subtitle: {
    bn: 'অ্যাকাউন্ট তৈরি করে আপনার ক্লাস পরিচালনা করুন',
    en: 'Create an account to manage your classes',
  },
  name: { bn: 'পুরো নাম', en: 'Full name' },
  institution: { bn: 'প্রতিষ্ঠান (ঐচ্ছিক)', en: 'Institution (optional)' },
  email: { bn: 'ইমেইল', en: 'Email Address' },
  password: { bn: 'পাসওয়ার্ড', en: 'Password' },
  confirm: { bn: 'পাসওয়ার্ড আবার লিখুন', en: 'Confirm password' },
  passwordHint: { bn: 'কমপক্ষে ৮ অক্ষর', en: 'At least 8 characters' },
  submit: { bn: 'অ্যাকাউন্ট তৈরি করুন', en: 'Create Account' },
  working: { bn: 'তৈরি হচ্ছে…', en: 'Creating…' },
  mismatch: { bn: 'দুটি পাসওয়ার্ড মিলছে না', en: 'Passwords do not match' },
  offline: { bn: 'সার্ভারে পৌঁছানো যাচ্ছে না।', en: 'Could not reach the server.' },
  assignmentNote: {
    bn: 'আপনার ক্লাস প্রশাসক নির্ধারণ করবেন।',
    en: 'An administrator assigns your classes after registration.',
  },
  haveAccount: { bn: 'সাইন ইন', en: 'Sign In' },
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
      language={language}
      backTo="/login/teacher"
      eyebrow={language === 'BN' ? 'শিক্ষক রেজিস্ট্রেশন' : 'Teacher sign up'}
      title={t('title')}
      subtitle={t('subtitle')}
      error={error}
      switchLine={
        <>
          {language === 'BN' ? 'অ্যাকাউন্ট আছে?' : 'Already have an account?'}{' '}
          <AuthLink to="/login/teacher">{t('haveAccount')}</AuthLink>
          <br />
          <AuthLink to="/register/student">{t('student')}</AuthLink>
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

        <Field
          label={t('institution')}
          icon={<BuildingIcon />}
          hint={t('assignmentNote')}
        >
          <input
            type="text"
            value={institution}
            placeholder={t('institution')}
            autoComplete="organization"
            onChange={(e) => setInstitution(e.target.value)}
          />
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
