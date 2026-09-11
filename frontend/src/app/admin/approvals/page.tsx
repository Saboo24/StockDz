'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock3, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStoredToken, getStoredUser } from '@/lib/api'
import { decidePendingUser, getPendingUsers, type PendingUser } from '@/lib/api/admin'
import { toast } from 'sonner'

const ADMIN_EMAILS = new Set(['admin@stockdz.dz', 'stockdz.support@gmail.com'])

export default function AdminApprovalsPage() {
  const router = useRouter()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const token = getStoredToken()
    const user = getStoredUser()

    if (!token || !user) {
      router.replace('/login')
      return
    }

    if (!ADMIN_EMAILS.has((user.email || '').toLowerCase())) {
      router.replace('/dashboard')
      return
    }

    void loadPendingUsers()
  }, [router])

  const loadPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await getPendingUsers()
      setUsers(response.users)
    } catch (error: any) {
      toast.error(error.message || 'Impossible de charger les demandes en attente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(userId)
      const response = await decidePendingUser(userId, action)
      toast.success(response.message)
      await loadPendingUsers()
    } catch (error: any) {
      toast.error(error.message || 'Impossible de traiter cette demande.')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl">
          <Card>
            <CardContent className="p-8 text-sm text-slate-500">Chargement des demandes d’approbation…</CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin approval
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Demandes d’inscription</h1>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Retour au dashboard</Button>
        </div>

        <Card>
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock3 className="h-5 w-5 text-amber-600" />
              Utilisateurs en attente ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">Aucune demande d’inscription en attente.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {users.map((user) => (
                  <div key={user.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-slate-600">{user.email}</div>
                      <div className="text-sm text-slate-500">Entreprise: {user.companyName}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        disabled={processingId === user.id}
                        onClick={() => handleDecision(user.id, 'reject')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        REJECT
                      </Button>
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={processingId === user.id}
                        onClick={() => handleDecision(user.id, 'approve')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        ACCEPT
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
