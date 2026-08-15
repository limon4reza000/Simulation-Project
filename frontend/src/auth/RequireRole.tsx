import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, homeRouteFor } from './AuthContext'

/**
 * Route guard.
 *
 * This is a usability measure, not a security boundary. The server enforces
 * roles on every endpoint — a student who edits their way past this guard
 * reaches a page whose API calls all return 403. Hiding a route is not the same
 * as protecting it, and only one of the two is load-bearing.
 */

interface Props {
  children: ReactNode
  /** Allowed role codes. Omit to require only that someone is signed in. */
  roles?: string[]
}

export default function RequireRole({ children, roles }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Never decide before the session is known, or a refresh throws a signed-in
  // user back to the login page.
  if (loading) {
    return <p className="app__loading">…</p>
  }

  if (!user) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login/student" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.roleCode)) {
    // Signed in but wrong role: send them to their own home rather than to a
    // login page they are already past.
    return <Navigate to={homeRouteFor(user)} replace />
  }

  return <>{children}</>
}
