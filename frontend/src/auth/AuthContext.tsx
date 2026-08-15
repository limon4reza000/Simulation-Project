import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, logout as apiLogout, type CurrentUser } from '../lib/api'

/**
 * Session state for the whole app.
 *
 * The cookie is httpOnly, so the client cannot read it — the only way to know
 * whether we are signed in is to ask the server. `loading` is therefore a real
 * state, not a nicety: rendering a guard before /auth/me resolves would bounce
 * a signed-in user to the login page on every refresh.
 */

interface AuthState {
  user: CurrentUser | null
  loading: boolean
  setUser: (user: CurrentUser | null) => void
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setUser(await fetchMe())
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await apiLogout().catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, setUser, signOut, refresh }),
    [user, loading, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

/** Where a role belongs after signing in. Single source of truth. */
export function homeRouteFor(user: CurrentUser | null): string {
  if (!user) return '/login/student'
  return user.roleCode === 'TEACHER' ? '/teacher' : '/learn'
}
