import { apiFetch, getStoredToken } from './index'

export async function getCompanySettings() {
  const token = getStoredToken()
  return apiFetch<{ company: any; settings: any }>('/api/company', { method: 'GET' }, token || undefined)
}

export async function updateCompanySettings(payload: Record<string, unknown>) {
  const token = getStoredToken()
  return apiFetch<{ company: any; settings: any }>('/api/company', { method: 'PUT', body: JSON.stringify(payload) }, token || undefined)
}
