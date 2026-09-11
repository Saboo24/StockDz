import { apiFetch, getStoredToken } from './index'

export type DashboardMetrics = {
  salesToday: number
  purchasesToday: number
  lowStockProducts: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  totalCustomers: number
  totalSuppliers: number
  inventoryValue: number
}

export async function getDashboardSummary() {
  const token = getStoredToken()
  return apiFetch<{ metrics: DashboardMetrics; recentSales: any[]; lowStockProducts: any[]; notifications: any[] }>(
    '/api/dashboard',
    { method: 'GET' },
    token || undefined,
  )
}
