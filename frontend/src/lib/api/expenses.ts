import { apiFetch, getStoredToken } from './index'

export type Expense = { id: string; title: string; category: string; amount: number | string; expenseDate: string; note?: string | null }

export async function getExpenses(params?: { category?: string; from?: string; to?: string }) {
  const token = getStoredToken()
  const query = new URLSearchParams()
  if (params?.category) query.set('category', params.category)
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch<{ expenses: Expense[] }>(`/api/expenses${suffix}`, { method: 'GET' }, token || undefined)
}
export async function getExpense(id: string) { return apiFetch<{ expense: Expense }>(`/api/expenses/${id}`, { method: 'GET' }, getStoredToken() || undefined) }
export async function createExpense(payload: Omit<Expense, 'id' | 'expenseDate'> & { expenseDate?: string }) { return apiFetch<{ expense: Expense }>('/api/expenses', { method: 'POST', body: JSON.stringify(payload) }, getStoredToken() || undefined) }
export async function updateExpense(id: string, payload: Omit<Expense, 'id' | 'expenseDate'> & { expenseDate?: string }) { return apiFetch<{ expense: Expense }>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, getStoredToken() || undefined) }
export async function deleteExpense(id: string) { return apiFetch<{ ok: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }, getStoredToken() || undefined) }
