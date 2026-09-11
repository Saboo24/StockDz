import { apiFetch, getStoredToken, API_URL } from './index'

export type Invoice = {
  id: string
  companyId: string
  invoiceNumber: string
  status: string
  createdAt: string
  sale: { total: number | string; customer?: { name: string } | null; items: Array<{ id: string; quantity: number; unitPrice: number | string; total: number | string; product: { name: string } }> }
}

export async function getInvoices(params?: { status?: string; from?: string; to?: string }) {
  const token = getStoredToken()
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch<{ invoices: Invoice[] }>(`/api/invoices${suffix}`, { method: 'GET' }, token || undefined)
}

export async function getInvoice(id: string) {
  const token = getStoredToken()
  return apiFetch<{ invoice: Invoice }>(`/api/invoices/${id}`, { method: 'GET' }, token || undefined)
}

export function getInvoicePdfUrl(id: string) { return `${API_URL}/api/invoices/${id}/pdf` }

export function getInvoicePdfHeaders(): Record<string, string> {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
