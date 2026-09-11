import {
  apiFetch,
  clearStoredCompany,
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  setStoredCompany,
  setStoredToken,
  setStoredUser,
} from './index'

export type AuthUser = {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  avatar?: string | null
  isActive?: boolean
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt?: string
}

export type CompanySummary = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export type AuthSession = {
  user: AuthUser
  company: CompanySummary
}

export async function login(email: string, password: string) {
  const payload = await apiFetch<{ token: string; user: AuthUser }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )

  setStoredToken(payload.token)
  setStoredUser(payload.user)
  return payload
}

export async function register(payload: {
  firstName: string
  lastName: string
  email: string
  password: string
  companyName: string
  phone?: string
}) {
  const result = await apiFetch<{ message?: string; token?: string; user?: AuthUser; company?: CompanySummary }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (result.token) {
    setStoredToken(result.token)
  }
  if (result.user) {
    setStoredUser(result.user)
  }
  if (result.company) {
    setStoredCompany(result.company)
  }
  return result
}

export async function logout() {
  try {
    const token = getStoredToken()
    await apiFetch('/api/auth/logout', { method: 'POST' }, token || undefined)
  } catch {
    // ignore logout errors and still clear local state
  }

  clearStoredToken()
  clearStoredUser()
  clearStoredCompany()
}

export async function me() {
  const token = getStoredToken()
  if (!token) {
    throw new Error('No session')
  }

  const result = await apiFetch<{ user: AuthUser; company: CompanySummary }>('/api/auth/me', { method: 'GET' }, token)
  setStoredUser(result.user)
  setStoredCompany(result.company)
  return result
}

export async function hydrateAuthSession() {
  const token = getStoredToken()
  if (!token) {
    clearStoredUser()
    clearStoredCompany()
    return null
  }

  try {
    return await me()
  } catch {
    clearStoredToken()
    clearStoredUser()
    clearStoredCompany()
    return null
  }
}

export async function forgotPassword(email: string, language: 'fr' | 'en' = 'en') {
  return apiFetch<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, language }),
  })
}

export async function verifyResetCode(email: string, code: string, language: 'fr' | 'en' = 'en') {
  return apiFetch<{ message: string }>('/api/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code, language }),
  })
}

export async function resetPasswordWithCode(email: string, code: string, password: string, language: 'fr' | 'en' = 'en') {
  return apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, password, language }),
  })
}

export async function resetPassword(token: string, password: string) {
  return apiFetch<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
