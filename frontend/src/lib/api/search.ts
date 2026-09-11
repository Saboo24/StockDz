import { apiFetch, getStoredToken } from './index'

export type SearchResults = Record<string, any[]>
export async function globalSearch(query: string) {
  return apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`, { method: 'GET' }, getStoredToken() || undefined)
}