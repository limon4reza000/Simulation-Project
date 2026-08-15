import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, homeRouteFor } from './auth/AuthContext'
import RequireRole from './auth/RequireRole'
import LoginPage from './pages/auth/LoginPage'
import StudentRegisterPage from './pages/auth/StudentRegisterPage'
import TeacherRegisterPage from './pages/auth/TeacherRegisterPage'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './App'
import type { Language } from './registry/types'
import './styles.css'

/**
 * Routing and role separation.
 *
 * Students and teachers get distinct login and registration routes, and
 * distinct dashboards. The guards here are convenience only — every endpoint
 * behind them re-checks the role server-side, so a tampered client reaches 403s
 * rather than data.
 */

function Root() {
  const [language, setLanguage] = useState<Language>('BN')

  return (
    <Routes>
      {/* Public authentication routes */}
      <Route
        path="/login/student"
        element={<RedirectIfSignedIn><LoginPage variant="student" language={language} /></RedirectIfSignedIn>}
      />
      <Route
        path="/login/teacher"
        element={<RedirectIfSignedIn><LoginPage variant="teacher" language={language} /></RedirectIfSignedIn>}
      />
      <Route
        path="/register/student"
        element={<RedirectIfSignedIn><StudentRegisterPage language={language} /></RedirectIfSignedIn>}
      />
      <Route
        path="/register/teacher"
        element={<RedirectIfSignedIn><TeacherRegisterPage language={language} /></RedirectIfSignedIn>}
      />

      {/* Student-only */}
      <Route
        path="/learn"
        element={
          <RequireRole roles={['STUDENT']}>
            <StudentDashboard language={language} onLanguageChange={setLanguage} />
          </RequireRole>
        }
      />

      {/* Teacher-only */}
      <Route
        path="/teacher"
        element={
          <RequireRole roles={['TEACHER']}>
            <TeacherDashboard language={language} />
          </RequireRole>
        }
      />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

/** Sends everyone to the right place for who they are. */
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <p className="app__loading">…</p>
  return <Navigate to={homeRouteFor(user)} replace />
}

/**
 * Keeps a signed-in user off the login and registration pages.
 *
 * Without this, a teacher who bookmarks the login page can sign in a second
 * time and generate a stray session for no reason.
 */
function RedirectIfSignedIn({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="app__loading">…</p>
  if (user) return <Navigate to={homeRouteFor(user)} replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
