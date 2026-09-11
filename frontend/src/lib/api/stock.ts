import { apiFetch, getStoredToken } from './index'

export type StockMovement = {
  id: string
  companyId: string
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  unitCost?: number | null
  reference?: string | null
  notes?: string | null
  createdAt?: string
}

export async function getStockOverview() {
  const token = getStoredToken()
  return apiFetch<{ products: any[] }>('/api/stock', { method: 'GET' }, token || undefined)
}

export async function getStockMovements() {
  const token = getStoredToken()
  return apiFetch<{ movements: StockMovement[] }>('/api/stock/movements', { method: 'GET' }, token || undefined)
}

export async function createStockMovement(payload: {
  productId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  unitCost?: number
  reference?: string
  notes?: string
}) {
  const token = getStoredToken()
  return apiFetch<{ movement: StockMovement; product: any }>('/api/stock/movements', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token || undefined)
}

export async function setInitialStock(payload: {
  productId: string
  quantity: number
  reference?: string
  notes?: string
}) {
  const token = getStoredToken()
  return apiFetch<{ movement: StockMovement; product: any }>('/api/stock/initial', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token || undefined)
}
