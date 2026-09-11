"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearStoredToken, clearStoredUser, getStoredToken } from '@/lib/api'
import { me } from '@/lib/api/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      router.replace('/login')
      return
    }

    me().then(() => router.replace('/dashboard')).catch(() => {
      clearStoredToken()
      clearStoredUser()
      router.replace('/login')
    })
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" />
        Chargement de StockDz...
      </div>
    </main>
  )
}
