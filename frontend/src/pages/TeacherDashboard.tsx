import { useEffect, useState } from 'react'
import { fetchTeacherOverview, type TeacherOverview } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { toBanglaDigits } from '../components/instruments/VernierCaliper'
import type { Language } from '../registry/types'

/**
 * Teacher dashboard.
 *
 * Shows only classes an administrator has assigned. A teacher with no
 * assignments sees an explanation rather than an empty grid, because "nothing
 * here" and "nothing assigned to you yet" mean different things to someone who
 * has just registered.
 */

const T = {
  heading: { bn: 'শিক্ষক ড্যাশবোর্ড', en: 'Teacher dashboard' },
  employee: { bn: 'শিক্ষক আইডি', en: 'Teacher ID' },
  institution: { bn: 'প্রতিষ্ঠান', en: 'Institution' },
  classes: { bn: 'নির্ধারিত ক্লাস', en: 'Assigned classes' },
  students: { bn: 'শিক্ষার্থী', en: 'students' },
  totalStudents: { bn: 'মোট শিক্ষার্থী', en: 'Total students' },
  none: {
    bn: 'এখনো কোনো ক্লাস নির্ধারণ করা হয়নি। প্রশাসক ক্লাস নির্ধারণ করলে এখানে দেখা যাবে।',
    en: 'No classes assigned yet. They will appear here once an administrator assigns them.',
  },
  loading: { bn: 'লোড হচ্ছে…', en: 'Loading…' },
  failed: { bn: 'তথ্য আনা যায়নি', en: 'Could not load your dashboard' },
} as const

export default function TeacherDashboard({
  language = 'BN',
}: {
  language?: Language
}) {
  const t = (key: keyof typeof T) => (language === 'BN' ? T[key].bn : T[key].en)
  const num = (v: number | string) =>
    language === 'BN' ? toBanglaDigits(Number(v), 'BN') : String(v)

  const { user, signOut } = useAuth()
  const [overview, setOverview] = useState<TeacherOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchTeacherOverview(controller.signal)
      .then(setOverview)
      .catch(() => setError(t('failed')))
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">{t('heading')}</p>
          <h1 className="app__title">{user?.name ?? ''}</h1>
        </div>
        <div className="app__actions">
          <button type="button" className="app__lang" onClick={() => void signOut()}>
            {language === 'BN' ? 'সাইন আউট' : 'Sign out'}
          </button>
        </div>
      </header>

      <main className="app__main">
        {error && <p className="app__error">{error}</p>}
        {!overview && !error && <p>{t('loading')}</p>}

        {overview && (
          <>
            <section className="teacher__meta">
              <div className="sim__readout">
                <span>{t('employee')}</span>
                <strong>{overview.employeeCode ?? '—'}</strong>
              </div>
              <div className="sim__readout">
                <span>{t('institution')}</span>
                <strong>{overview.institution ?? '—'}</strong>
              </div>
              <div className="sim__readout is-emphasis">
                <span>{t('totalStudents')}</span>
                <strong>{num(overview.totalStudents)}</strong>
              </div>
            </section>

            <h2 className="teacher__heading">{t('classes')}</h2>
            {overview.assignments.length === 0 ? (
              <p className="teacher__empty">{t('none')}</p>
            ) : (
              <ul className="teacher__classes">
                {overview.assignments.map((a) => (
                  <li key={`${a.classId}-${a.subjectNameEn ?? 'all'}`}>
                    <strong>
                      {language === 'BN' ? a.classNameBn : a.classNameEn}
                    </strong>
                    {a.subjectNameEn && (
                      <span>
                        {' — '}
                        {language === 'BN' ? a.subjectNameBn : a.subjectNameEn}
                      </span>
                    )}
                    <span className="teacher__count">
                      {num(a.studentCount)} {t('students')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  )
}
