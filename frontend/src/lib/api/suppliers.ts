import { apiFetch, getStoredToken } from './index'

export type Supplier = {
  id: string
  companyId: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  createdAt?: string
}

export async function getSuppliers() {
  const token = getStoredToken()
  return apiFetch<{ suppliers: Supplier[] }>('/api/suppliers', { method: 'GET' }, token || undefined)
}

export async function getSupplier(id: string) {
  const token = getStoredToken()
  return apiFetch<{ supplier: Supplier }>(`/api/suppliers/${id}`, { method: 'GET' }, token || undefined)
}

export async function createSupplier(payload: Partial<Supplier> & { name: string }) {
  const token = getStoredToken()
  return apiFetch<{ supplier: Supplier }>('/api/suppliers', { method: 'POST', body: JSON.stringify(payload) }, token || undefined)
}

export async function updateSupplier(id: string, payload: Partial<Supplier>) {
  const token = getStoredToken()
  return apiFetch<{ supplier: Supplier }>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token || undefined)
}

export async function deleteSupplier(id: string) {
  const token = getStoredToken()
  return apiFetch<{ ok: boolean }>(`/api/suppliers/${id}`, { method: 'DELETE' }, token || undefined)
}
