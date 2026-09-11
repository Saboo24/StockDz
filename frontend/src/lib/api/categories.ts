import { apiFetch, getStoredToken } from './index'

export type Category = {
  id: string
  companyId: string
  name: string
  slug: string
  color?: string | null
  createdAt?: string
}

export async function getCategories() {
  const token = getStoredToken()
  return apiFetch<{ categories: Category[] }>('/api/categories', { method: 'GET' }, token || undefined)
}

export async function createCategory(payload: { name: string; color?: string }) {
  const token = getStoredToken()
  return apiFetch<{ category: Category }>('/api/categories', { method: 'POST', body: JSON.stringify(payload) }, token || undefined)
}

export async function updateCategory(id: string, payload: { name: string; color?: string }) {
  const token = getStoredToken()
  return apiFetch<{ category: Category }>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token || undefined)
}

export async function deleteCategory(id: string) {
  const token = getStoredToken()
  return apiFetch<{ ok: boolean; category: Category }>(`/api/categories/${id}`, {
    method: 'DELETE',
  }, token || undefined)
}
