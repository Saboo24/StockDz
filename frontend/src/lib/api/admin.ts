import { apiFetch, getStoredToken } from './index'

export type PendingUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  isActive: boolean
  createdAt: string
}

export async function getPendingUsers() {
  const token = getStoredToken()
  if (!token) throw new Error('No session')

  return apiFetch<{ users: PendingUser[] }>('/api/admin/pending-users', { method: 'GET' }, token)
}

export async function decidePendingUser(userId: string, action: 'approve' | 'reject') {
  const token = getStoredToken()
  if (!token) throw new Error('No session')

  return apiFetch<{ ok: boolean; message: string; user: PendingUser }>('/api/admin/users/' + userId + '/decision', {
    method: 'POST',
    body: JSON.stringify({ action }),
  }, token)
}
