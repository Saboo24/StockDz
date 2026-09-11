'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { clearStoredCompany, clearStoredToken, clearStoredUser, getStoredCompany, getStoredUser, setStoredCompany, setStoredUser } from '@/lib/api'
import { hydrateAuthSession, type AuthSession, type AuthUser, type CompanySummary } from '@/lib/api/auth'

const AuthContext = createContext<{
  user: AuthUser | null
  company: CompanySummary | null
  isReady: boolean
  refreshSession: () => Promise<void>
  clearSession: () => void
  setSession: (session: AuthSession) => void
} | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUserState] = useState<AuthUser | null>(getStoredUser())
  const [company, setCompanyState] = useState<CompanySummary | null>(getStoredCompany())
  const [isReady, setIsReady] = useState(false)

  const setSession = useCallback((session: AuthSession) => {
    setUserState(session.user)
    setCompanyState(session.company)
    setStoredUser(session.user)
    setStoredCompany(session.company)
  }, [])

  const clearSession = useCallback(() => {
    setUserState(null)
    setCompanyState(null)
    clearStoredUser()
    clearStoredCompany()
    clearStoredToken()
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const session = await hydrateAuthSession()
      if (session) {
        setSession(session)
      } else {
        clearSession()
      }
    } catch {
      clearSession()
    } finally {
      setIsReady(true)
    }
  }, [clearSession, setSession])

  useEffect(() => {
    const cachedUser = getStoredUser()
    const cachedCompany = getStoredCompany()

    if (cachedUser) {
      setUserState(cachedUser)
    }
    if (cachedCompany) {
      setCompanyState(cachedCompany)
    }

    void refreshSession()
  }, [refreshSession])

  const isPublicRoute = pathname === '/login'
    || pathname === '/register'
    || pathname === '/forgot-password'
    || pathname === '/reset-password'
    || pathname === '/approval-result'
    || pathname === '/'

  useEffect(() => {
    if (!isReady || isPublicRoute || user) return
    router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [isPublicRoute, isReady, pathname, router, user])

  const value = useMemo(() => ({
    user,
    company,
    isReady,
    refreshSession,
    clearSession,
    setSession,
  }), [company, clearSession, isReady, refreshSession, setSession, user])

  if ((!isReady || !user) && !isPublicRoute) {
    return <AuthContext.Provider value={value}><div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Loading...</div></AuthContext.Provider>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Client providers for the App Router. Design tokens live entirely in
 * app/globals.css (single file, Tailwind v4). Dark mode is a `.dark` class on
 * <html> set pre-paint by the inline script in layout.tsx — no theme provider,
 * no competing style layer.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <AuthProvider>
          <div className="flex w-full flex-1 flex-col min-h-0">{children}</div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
