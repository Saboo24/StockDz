import { apiFetch, getStoredToken } from './index'

export type Product = {
  id: string
  companyId: string
  categoryId?: string | null
  sku: string
  name: string
  barcode?: string | null
  description?: string | null
  buyPrice: number | string
  sellPrice: number | string
  stock: number
  minStock: number
  unit: string
  image?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export async function getProducts(params?: { search?: string; categoryId?: string; lowStock?: boolean }) {
  const token = getStoredToken()
  const search = new URLSearchParams()

  if (params?.search) search.set('search', params.search)
  if (params?.categoryId) search.set('categoryId', params.categoryId)
  if (params?.lowStock) search.set('lowStock', 'true')

  const queryString = search.toString()
  const url = queryString ? `/api/products?${queryString}` : '/api/products'

  return apiFetch<{ products: Product[] }>(url, { method: 'GET' }, token || undefined)
}

export async function getProduct(id: string) {
  const token = getStoredToken()
  return apiFetch<{ product: Product }>(`/api/products/${id}`, { method: 'GET' }, token || undefined)
}

export async function createProduct(payload: Partial<Product> & { sku: string; name: string; buyPrice: number; sellPrice: number; stock?: number }) {
  const token = getStoredToken()
  return apiFetch<{ product: Product }>('/api/products', { method: 'POST', body: JSON.stringify(payload) }, token || undefined)
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  const token = getStoredToken()
  return apiFetch<{ product: Product }>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token || undefined)
}

export async function deleteProduct(id: string) {
  const token = getStoredToken()
  return apiFetch<{ ok: boolean }>(`/api/products/${id}`, { method: 'DELETE' }, token || undefined)
}
