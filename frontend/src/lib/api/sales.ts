import { apiFetch, getStoredToken } from './index'

export type SaleItem = {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPrice: number | string
  total: number | string
  product?: { id: string; name: string; sku?: string }
}

export type Sale = {
  id: string
  companyId: string
  customerId?: string | null
  invoiceNumber: string
  total: number | string
  status?: string
  note?: string | null
  createdAt?: string
  customer?: { id: string; name: string; email?: string | null } | null
  items?: SaleItem[]
}

export async function getSales() {
  const token = getStoredToken()
  return apiFetch<{ sales: Sale[] }>('/api/sales', { method: 'GET' }, token || undefined)
}

export async function getSale(id: string) {
  const token = getStoredToken()
  return apiFetch<{ sale: Sale }>(`/api/sales/${id}`, { method: 'GET' }, token || undefined)
}

export async function createSale(payload: {
  customerId?: string
  invoiceNumber: string
  note?: string
  items: Array<{ productId: string; quantity: number; unitPrice: number }>
}) {
  const token = getStoredToken()
  return apiFetch<{ sale: Sale }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token || undefined)
}

export async function updateSale(id: string, payload: {
  customerId?: string
  invoiceNumber: string
  note?: string
  items: Array<{ productId: string; quantity: number; unitPrice: number }>
}) {
  const token = getStoredToken()
  return apiFetch<{ sale: Sale }>(`/api/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token || undefined)
}

export async function deleteSale(id: string) {
  const token = getStoredToken()
  return apiFetch<{ deleted: boolean; id: string }>(`/api/sales/${id}`, {
    method: 'DELETE',
  }, token || undefined)
}
