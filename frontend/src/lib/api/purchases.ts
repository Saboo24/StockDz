import { apiFetch, getStoredToken } from './index'

export type PurchaseItem = {
  id: string
  purchaseId: string
  productId: string
  quantity: number
  unitPrice: number | string
  total: number | string
  product?: { id: string; name: string; sku?: string }
}

export type Purchase = {
  id: string
  companyId: string
  supplierId?: string | null
  invoiceNumber: string
  total: number | string
  status?: string
  note?: string | null
  createdAt?: string
  supplier?: { id: string; name: string; email?: string | null } | null
  items?: PurchaseItem[]
}

export async function getPurchases() {
  const token = getStoredToken()
  return apiFetch<{ purchases: Purchase[] }>('/api/purchases', { method: 'GET' }, token || undefined)
}

export async function getPurchase(id: string) {
  const token = getStoredToken()
  return apiFetch<{ purchase: Purchase }>(`/api/purchases/${id}`, { method: 'GET' }, token || undefined)
}

export async function createPurchase(payload: {
  supplierId?: string
  invoiceNumber: string
  note?: string
  items: Array<{ productId: string; quantity: number; unitPrice: number }>
}) {
  const token = getStoredToken()
  return apiFetch<{ purchase: Purchase }>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token || undefined)
}

export async function updatePurchase(id: string, payload: {
  supplierId?: string
  invoiceNumber: string
  note?: string
  items: Array<{ productId: string; quantity: number; unitPrice: number }>
}) {
  const token = getStoredToken()
  return apiFetch<{ purchase: Purchase }>(`/api/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token || undefined)
}

export async function deletePurchase(id: string) {
  const token = getStoredToken()
  return apiFetch<{ deleted: boolean; id: string }>(`/api/purchases/${id}`, {
    method: 'DELETE',
  }, token || undefined)
}
