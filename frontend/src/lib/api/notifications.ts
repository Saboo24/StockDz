import { apiFetch, getStoredToken } from './index'

export type Notification = { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }
const auth = () => getStoredToken() || undefined
export async function getNotifications() { return apiFetch<{ notifications: Notification[] }>('/api/notifications', { method: 'GET' }, auth()) }
export async function getNotification(id: string) { return apiFetch<{ notification: Notification }>(`/api/notifications/${id}`, { method: 'GET' }, auth()) }
export async function markNotificationRead(id: string) { return apiFetch<{ notification: Notification }>(`/api/notifications/${id}/read`, { method: 'PUT' }, auth()) }
export async function markAllNotificationsRead() { return apiFetch<{ ok: boolean }>('/api/notifications/read-all', { method: 'PUT' }, auth()) }
export async function deleteNotification(id: string) { return apiFetch<{ ok: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' }, auth()) }
