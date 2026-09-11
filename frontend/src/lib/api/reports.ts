import { apiFetch, getStoredToken } from './index'

export type Report = { type: string; title: string; generatedAt: string; [key: string]: any }
export async function getReport(type: string) {
  return apiFetch<{ report: Report }>(`/api/reports/${type}`, { method: 'GET' }, getStoredToken() || undefined)
}