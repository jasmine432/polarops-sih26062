export type UserRole = 'ADMIN' | 'PHC' | 'DOCTOR'

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  role: UserRole
  station: string
}

interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  user: AuthenticatedUser
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''
const SESSION_KEY = 'polarops-session'

export interface AuthSession {
  token: string
  user: AuthenticatedUser
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (typeof value !== 'object' || value === null) return false
  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    (user.role === 'ADMIN' || user.role === 'PHC' || user.role === 'DOCTOR') &&
    typeof user.station === 'string'
  )
}

export function getStoredSession(): AuthSession | null {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (!saved) return null
    const parsed: unknown = JSON.parse(saved)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).token === 'string' &&
      isAuthenticatedUser((parsed as Record<string, unknown>).user)
    ) {
      return parsed as AuthSession
    }
  } catch {
    // Treat malformed browser storage as unauthenticated.
  }
  return null
}

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getAccessToken(): string | null {
  return getStoredSession()?.token ?? null
}

export async function authenticate(identifier: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  if (!response.ok) throw new Error('Invalid email/employee ID or password.')

  const payload: unknown = await response.json()
  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as Record<string, unknown>).access_token !== 'string' ||
    !isAuthenticatedUser((payload as Record<string, unknown>).user)
  ) {
    throw new Error('Authentication service returned an invalid session.')
  }
  return { token: (payload as LoginResponse).access_token, user: (payload as LoginResponse).user }
}
