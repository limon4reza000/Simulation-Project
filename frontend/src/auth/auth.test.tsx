// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, homeRouteFor } from './AuthContext'
import RequireRole from './RequireRole'
import LoginPage from '../pages/auth/LoginPage'
import StudentRegisterPage from '../pages/auth/StudentRegisterPage'
import TeacherRegisterPage from '../pages/auth/TeacherRegisterPage'

/**
 * Separate student and teacher authentication flows.
 *
 * `fetch` is stubbed so these exercise the real components and the real client,
 * without a server. The role-protection tests assert the client behaves well;
 * the actual enforcement is server-side and covered in the backend suite.
 */

const STUDENT = {
  userId: 42,
  name: 'Limon',
  roleCode: 'STUDENT',
  preferredLanguage: 'BN',
  isStudent: true,
}
const TEACHER = {
  userId: 77,
  name: 'Rashid Sir',
  roleCode: 'TEACHER',
  preferredLanguage: 'BN',
  isStudent: false,
}

const CLASSES = [
  { id: 106, level: 6, nameBn: 'ষষ্ঠ শ্রেণি', nameEn: 'Class 6' },
  { id: 109, level: 9, nameBn: 'নবম শ্রেণি', nameEn: 'Class 9' },
  { id: 110, level: 10, nameBn: 'দশম শ্রেণি', nameEn: 'Class 10' },
]

interface StubOptions {
  me?: typeof STUDENT | typeof TEACHER | null
  loginResult?: typeof STUDENT | typeof TEACHER
  loginError?: { status: number; code: string; message: string }
  registerResult?: unknown
  registerError?: { status: number; code: string; message: string }
}

const calls: { url: string; body: unknown }[] = []

function stubFetch(options: StubOptions = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ url, body })

    const json = (data: unknown, status = 200) =>
      ({
        ok: status < 400,
        status,
        json: async () => (status < 400 ? { data } : data),
      }) as Response

    if (url.includes('/auth/me')) {
      return options.me
        ? json(options.me)
        : json({ error: { code: 'UNAUTHENTICATED', message: 'nope' } }, 401)
    }
    if (url.includes('/auth/enrollable-classes')) return json(CLASSES)
    if (url.includes('/auth/login')) {
      if (options.loginError) {
        return json({ error: options.loginError }, options.loginError.status)
      }
      return json(options.loginResult ?? STUDENT)
    }
    if (url.includes('/auth/register/')) {
      if (options.registerError) {
        return json({ error: options.registerError }, options.registerError.status)
      }
      return json(options.registerResult ?? STUDENT, 201)
    }
    return json({})
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Renders a route tree with landing pages that just name themselves. */
function renderAt(path: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={element} />
          <Route path="/learn" element={<div>STUDENT DASHBOARD</div>} />
          <Route path="/teacher" element={<div>TEACHER DASHBOARD</div>} />
          <Route path="/login/student" element={<div>STUDENT LOGIN PAGE</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  calls.length = 0
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('homeRouteFor', () => {
  it('sends each role to its own dashboard', () => {
    expect(homeRouteFor(STUDENT)).toBe('/learn')
    expect(homeRouteFor(TEACHER)).toBe('/teacher')
    expect(homeRouteFor(null)).toBe('/login/student')
  })
})

describe('student login', () => {
  it('signs in and lands on the student dashboard', async () => {
    stubFetch({ loginResult: STUDENT })
    renderAt('/login/student', <LoginPage variant="student" language="EN" />)

    await screen.findByText('Student sign in')
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'student@example.local' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ChangeMe!123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    expect(await screen.findByText('STUDENT DASHBOARD')).toBeDefined()
  })

  it('shows the server message on bad credentials, without guessing', async () => {
    stubFetch({
      loginError: {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Incorrect email or password',
      },
    })
    renderAt('/login/student', <LoginPage variant="student" language="EN" />)

    await screen.findByText('Student sign in')
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'nobody@example.local' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Incorrect email or password')
    expect(screen.queryByText('STUDENT DASHBOARD')).toBeNull()
  })

  it('sends credentials so the session cookie is set', async () => {
    const fetchMock = stubFetch({ loginResult: STUDENT })
    renderAt('/login/student', <LoginPage variant="student" language="EN" />)
    await screen.findByText('Student sign in')
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    await waitFor(() => {
      const loginCall = fetchMock.mock.calls.find((c) =>
        String(c[0]).includes('/auth/login'),
      )
      expect(loginCall?.[1]?.credentials).toBe('include')
    })
  })
})

describe('teacher login', () => {
  it('signs in and lands on the TEACHER dashboard', async () => {
    stubFetch({ loginResult: TEACHER })
    renderAt('/login/teacher', <LoginPage variant="teacher" language="EN" />)

    await screen.findByText('Teacher sign in')
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'teacher@example.local' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ChangeMe!123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    expect(await screen.findByText('TEACHER DASHBOARD')).toBeDefined()
  })

  it('routes by role, not by which page was used', async () => {
    // A teacher signing in through the student page still lands on /teacher.
    stubFetch({ loginResult: TEACHER })
    renderAt('/login/student', <LoginPage variant="student" language="EN" />)

    await screen.findByText('Student sign in')
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))

    expect(await screen.findByText('TEACHER DASHBOARD')).toBeDefined()
  })
})

describe('student registration', () => {
  async function fillBase() {
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Limon Reza' },
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'limon@example.local' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ChangeMe!123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'ChangeMe!123' },
    })
  }

  it('offers classes 6 to 10 from the server', async () => {
    stubFetch()
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    await screen.findByText('Student sign up')

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Class 6' })).toBeDefined()
    })
    expect(screen.getByRole('option', { name: 'Class 9' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Class 10' })).toBeDefined()
  })

  it('submits the chosen class and lands on the student dashboard', async () => {
    stubFetch({ registerResult: { ...STUDENT, classLevel: 9 } })
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    await screen.findByText('Student sign up')
    await waitFor(() => screen.getByRole('option', { name: 'Class 9' }))

    await fillBase()
    fireEvent.change(screen.getByLabelText('Class'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(await screen.findByText('STUDENT DASHBOARD')).toBeDefined()
    const call = calls.find((c) => c.url.includes('/auth/register/student'))
    expect(call?.body).toMatchObject({ classLevel: 9, name: 'Limon Reza' })
  })

  it('never sends a role field the server could trust', async () => {
    stubFetch({ registerResult: STUDENT })
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    await screen.findByText('Student sign up')
    await waitFor(() => screen.getByRole('option', { name: 'Class 9' }))

    await fillBase()
    fireEvent.change(screen.getByLabelText('Class'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      const call = calls.find((c) => c.url.includes('/auth/register/student'))
      expect(call).toBeDefined()
      expect(Object.keys(call!.body as object).sort()).toEqual([
        'classLevel',
        'email',
        'name',
        'password',
      ])
    })
  })

  it('refuses to submit without a class', async () => {
    stubFetch()
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    await screen.findByText('Student sign up')
    await fillBase()

    // The select is `required`, so the browser blocks submission before any of
    // our code runs. Asserting on an error message would therefore be testing
    // a path real users never reach; what matters is that nothing is sent and
    // the student stays on the form.
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await new Promise((r) => setTimeout(r, 50))

    expect(calls.some((c) => c.url.includes('/auth/register/student'))).toBe(false)
    expect(screen.getByText('Student sign up')).toBeDefined()
    expect(screen.queryByText('STUDENT DASHBOARD')).toBeNull()
  })

  it('the class select is marked required so it cannot be skipped', () => {
    stubFetch()
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    const select = screen.getByLabelText('Class') as HTMLSelectElement
    expect(select.required).toBe(true)
    expect(select.value).toBe('')
  })

  it('refuses to submit when the passwords differ', async () => {
    stubFetch()
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    await screen.findByText('Student sign up')
    await waitFor(() => screen.getByRole('option', { name: 'Class 9' }))

    await fillBase()
    fireEvent.change(screen.getByLabelText('Class'), { target: { value: '9' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'something-else' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Passwords do not match')
    })
    expect(calls.some((c) => c.url.includes('/auth/register/student'))).toBe(false)
  })

  it('surfaces a server rejection, e.g. a taken email', async () => {
    stubFetch({
      registerError: {
        status: 409,
        code: 'EMAIL_TAKEN',
        message: 'An account with that email already exists',
      },
    })
    renderAt('/register/student', <StudentRegisterPage language="EN" />)
    await screen.findByText('Student sign up')
    await waitFor(() => screen.getByRole('option', { name: 'Class 9' }))

    await fillBase()
    fireEvent.change(screen.getByLabelText('Class'), { target: { value: '9' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('An account with that email already exists')
  })
})

describe('teacher registration', () => {
  it('creates a teacher and lands on the teacher dashboard', async () => {
    stubFetch({ registerResult: TEACHER })
    renderAt('/register/teacher', <TeacherRegisterPage language="EN" />)
    await screen.findByText('Teacher sign up')

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Rashid Sir' },
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'rashid@example.local' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'ChangeMe!123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'ChangeMe!123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(await screen.findByText('TEACHER DASHBOARD')).toBeDefined()
    const call = calls.find((c) => c.url.includes('/auth/register/teacher'))
    expect(call?.url).toContain('/auth/register/teacher')
  })

  it('has no class field — a teacher is not enrolled in one', async () => {
    stubFetch()
    renderAt('/register/teacher', <TeacherRegisterPage language="EN" />)
    await screen.findByText('Teacher sign up')
    expect(screen.queryByLabelText('Class')).toBeNull()
  })
})

describe('role-based route guards', () => {
  it('sends an anonymous visitor to the student login page', async () => {
    stubFetch({ me: null })
    renderAt(
      '/learn',
      <RequireRole roles={['STUDENT']}>
        <div>PROTECTED STUDENT AREA</div>
      </RequireRole>,
    )
    expect(await screen.findByText('STUDENT LOGIN PAGE')).toBeDefined()
  })

  it('lets a student into student-only routes', async () => {
    stubFetch({ me: STUDENT })
    renderAt(
      '/learn',
      <RequireRole roles={['STUDENT']}>
        <div>PROTECTED STUDENT AREA</div>
      </RequireRole>,
    )
    expect(await screen.findByText('PROTECTED STUDENT AREA')).toBeDefined()
  })

  it('BLOCKS a student from a teacher-only route and redirects them home', async () => {
    stubFetch({ me: STUDENT })
    renderAt(
      '/teacher',
      <RequireRole roles={['TEACHER']}>
        <div>PROTECTED TEACHER AREA</div>
      </RequireRole>,
    )
    expect(await screen.findByText('STUDENT DASHBOARD')).toBeDefined()
    expect(screen.queryByText('PROTECTED TEACHER AREA')).toBeNull()
  })

  it('BLOCKS a teacher from a student-only route and redirects them home', async () => {
    stubFetch({ me: TEACHER })
    renderAt(
      '/learn',
      <RequireRole roles={['STUDENT']}>
        <div>PROTECTED STUDENT AREA</div>
      </RequireRole>,
    )
    expect(await screen.findByText('TEACHER DASHBOARD')).toBeDefined()
    expect(screen.queryByText('PROTECTED STUDENT AREA')).toBeNull()
  })

  it('does not decide before the session is known', async () => {
    // A guard that rendered during loading would bounce a signed-in user to
    // the login page on every refresh.
    let resolveMe: (value: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveMe = resolve
          }),
      ),
    )
    renderAt(
      '/teacher',
      <RequireRole roles={['TEACHER']}>
        <div>PROTECTED TEACHER AREA</div>
      </RequireRole>,
    )
    expect(screen.queryByText('STUDENT LOGIN PAGE')).toBeNull()
    expect(screen.queryByText('PROTECTED TEACHER AREA')).toBeNull()

    resolveMe({ ok: true, status: 200, json: async () => ({ data: TEACHER }) })
    expect(await screen.findByText('PROTECTED TEACHER AREA')).toBeDefined()
  })
})
