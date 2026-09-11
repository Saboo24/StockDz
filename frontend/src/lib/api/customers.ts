import { apiFetch, getStoredToken } from './index'

export type Customer = {
  id: string
  companyId: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  createdAt?: string
}

export async function getCustomers() {
  const token = getStoredToken()
  return apiFetch<{ customers: Customer[] }>('/api/customers', { method: 'GET' }, token || undefined)
}

export async function getCustomer(id: string) {
  const token = getStoredToken()
  return apiFetch<{ customer: Customer }>(`/api/customers/${id}`, { method: 'GET' }, token || undefined)
}

export async function createCustomer(payload: Partial<Customer> & { name: string }) {
  const token = getStoredToken()
  return apiFetch<{ customer: Customer }>('/api/customers', { method: 'POST', body: JSON.stringify(payload) }, token || undefined)
}

export async function updateCustomer(id: string, payload: Partial<Customer>) {
  const token = getStoredToken()
  return apiFetch<{ customer: Customer }>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token || undefined)
}

export async function deleteCustomer(id: string) {
  const token = getStoredToken()
  return apiFetch<{ ok: boolean }>(`/api/customers/${id}`, { method: 'DELETE' }, token || undefined)
}
