export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export type ApiErrorPayload = {
  message?: string
  issues?: Array<{ message?: string }>
}

export class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function apiFetch<T>(
  input: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(init.headers || {})
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${input}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message = payload?.message || 'Une erreur est survenue.'
    throw new ApiError(response.status, message, payload || undefined)
  }

  return payload as T
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('StockDz_token')
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('StockDz_token', token)
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('StockDz_token')
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('StockDz_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem('StockDz_user', JSON.stringify(user))
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('StockDz_user')
}

export function getStoredCompany() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('StockDz_company')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredCompany(company: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem('StockDz_company', JSON.stringify(company))
}

export function clearStoredCompany() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('StockDz_company')
}
