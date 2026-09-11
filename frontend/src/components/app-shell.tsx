"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, Boxes, ChevronDown, ChevronRight,
  HelpCircle, CreditCard, FileText, FolderTree, LayoutDashboard, Menu, Moon, MoreHorizontal,
  Package, Plus, Search, Settings, ShoppingCart, Sun, Truck, Users, X, LogOut,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "@/lib/api/notifications"
import { logout } from "@/lib/api/auth"
import { getStoredUser } from "@/lib/api"
import { globalSearch, type SearchResults } from "@/lib/api/search"
import { useAuth } from "@/app/provider"
import { getStoredLanguage, setStoredLanguage, t, type Language } from "@/lib/i18n"

const buildNavGroups = (language: Language) => [
  { label: t('overview', language), items: [{ label: t('overview', language), icon: LayoutDashboard, href: "/dashboard" }, { label: t('reports', language), icon: Activity, href: "/reports" }] },
  { label: t('operations', language), items: [
    { label: t('products', language), icon: Package, href: "/products" },
    { label: t('categories', language), icon: FolderTree, href: "/categories" },
    { label: t('stock', language), icon: Boxes, href: "/stock" },
    { label: t('movements', language), icon: ArrowDownLeft, href: "/movements" },
    { label: t('sales', language), icon: ShoppingCart, href: "/sales" },
    { label: t('purchases', language), icon: Truck, href: "/purchases" },
  ] },
  { label: t('contacts', language), items: [
    { label: t('customers', language), icon: Users, href: "/clients" },
    { label: t('suppliers', language), icon: Boxes, href: "/suppliers" },
  ] },
  { label: t('management', language), items: [
    { label: t('invoices', language), icon: FileText, href: "/factures" },
    { label: t('expenses', language), icon: CreditCard, href: "/depenses" },
    { label: t('settings', language), icon: Settings, href: "/settings" },
  ] },
]

interface SidebarProps {
  activePath: string
  onNavClick: (path: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  dark: boolean
}

export function Sidebar({ activePath, onNavClick, sidebarOpen, setSidebarOpen, dark }: SidebarProps) {
  const router = useRouter()
  const { user, clearSession } = useAuth()
  const persistedUser = user ?? getStoredUser()
  const [language, setLanguage] = useState<Language>(getStoredLanguage())
  const navGroups = buildNavGroups(language)

  useEffect(() => {
    setLanguage(getStoredLanguage())
  }, [])

  const initials = persistedUser ? `${persistedUser.firstName?.charAt(0) ?? ''}${persistedUser.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U' : 'U'
  const displayName = persistedUser ? `${persistedUser.firstName ?? ''} ${persistedUser.lastName ?? ''}`.trim() || persistedUser.email : 'Utilisateur'

  const handleLogout = async () => {
    await logout()
    clearSession()
    router.replace('/login')
  }
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-sidebar-border px-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">S</div>
          <div>
            <p className="text-[15px] font-bold tracking-tight">Stock<span className="text-sidebar-primary">DZ</span></p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">Business OS</p>
          </div>
        </Link>
        <button aria-label="Fermer le menu" className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden" onClick={() => setSidebarOpen(false)}><X className="size-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">{group.label}</p>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activePath === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}
                  >
                    <Icon className={`size-[17px] shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link href="/aide" onClick={() => setSidebarOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <HelpCircle className="size-4" />
          {t('helpCenter', language)}
        </Link>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/70 p-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-bold text-sidebar-primary">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">{persistedUser?.email || t('userAccount', language)}</p>
          </div>
          <button onClick={handleLogout} aria-label={t('logout', language)} className="rounded p-1 hover:bg-sidebar-accent">
            <LogOut className="size-4 text-sidebar-foreground/50" />
          </button>
        </div>
      </div>
    </aside>
  )
}

interface HeaderProps {
  title: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  dark: boolean
  onThemeToggle: () => void
}

export function Header({ title, sidebarOpen, setSidebarOpen, dark, onThemeToggle }: HeaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const persistedUser = user ?? getStoredUser()
  const [language, setLanguage] = useState<Language>(getStoredLanguage())
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const loadNotifications = async () => {
    try {
      setNotifications((await getNotifications()).notifications || [])
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger les notifications.")
    }
  }

  useEffect(() => { loadNotifications() }, [])

  useEffect(() => {
    setLanguage(getStoredLanguage())
  }, [])

  useEffect(() => {
    const query = search.trim()
    if (!query) {
      setSearchResults(null)
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true)
        setSearchResults({})
        setSearchResults(await globalSearch(query))
      } catch (error: any) {
        toast.error(error.message || "Impossible de charger les résultats.")
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const unreadCount = notifications.filter((notification) => !notification.isRead).length
  const displayNotificationMessage = (message: string) => message.replace(/\sDA\b/g, ' DZA')

  return (
    <header className="relative sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-9">
      <div className="flex items-center gap-3">
        <button aria-label={t('openMenu', language)} className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="size-5" />
        </button>
        <div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 sm:flex sm:w-[260px]">
          <Search className="size-4" />
          <input aria-label="Recherche globale" placeholder={t('search', language)} value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" />
        </div>
        <p className="text-sm font-semibold sm:hidden">{title}</p>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button aria-label={t('search', language)} onClick={() => document.querySelector<HTMLInputElement>('input[aria-label="Recherche globale"]')?.focus()} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden">
          <Search className="size-[18px]" />
        </button>
        <div className="hidden items-center rounded-lg border border-border/70 bg-card px-2 py-1.5 text-[11px] text-muted-foreground sm:flex">
          <button
            type="button"
            onClick={() => {
              const next = language === 'fr' ? 'en' : 'fr'
              setLanguage(next)
              setStoredLanguage(next)
              window.location.reload()
            }}
            className="font-medium text-primary hover:underline"
          >
            {language === 'fr' ? t('english', language) : t('french', language)}
          </button>
        </div>
        <button aria-label={t('changeTheme', language)} onClick={onThemeToggle} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
        <button aria-label={t('notifications', language)} onClick={() => { setNotificationsOpen((open) => !open); loadNotifications() }} className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bell className="size-[18px]" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background" />}
        </button>
        {notificationsOpen && <div className="absolute right-4 top-16 z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-border bg-card p-3 shadow-lg"><div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}</span>{unreadCount > 0 && <button className="text-xs text-primary hover:underline" onClick={async () => { await markAllNotificationsRead(); await loadNotifications() }}>Mark all as read</button>}</div><div className="max-h-80 space-y-1 overflow-y-auto">{notifications.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">No notifications.</p> : notifications.map((notification) => <div key={notification.id} className={`rounded-md p-2 text-xs ${notification.isRead ? "" : "bg-primary/8"}`}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{notification.title}</p><p className="mt-0.5 text-muted-foreground">{notification.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(notification.createdAt).toLocaleString("en-US")}</p></div>{!notification.isRead && <button className="shrink-0 text-primary hover:underline" onClick={async () => { await markNotificationRead(notification.id); await loadNotifications() }}>Mark as read</button>}</div></div>)}</div></div>}
        {searchResults && <div className="absolute left-4 top-16 z-50 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-border bg-card p-3 shadow-lg sm:left-6 lg:left-9"><div className="mb-2 text-xs text-muted-foreground">{searchLoading ? "Searching..." : "Results"}</div>{searchLoading ? <p className="py-3 text-sm text-muted-foreground">Searching...</p> : Object.entries(searchResults).every(([, values]) => values.length === 0) ? <p className="py-3 text-sm text-muted-foreground">No results</p> : <div className="max-h-80 space-y-2 overflow-y-auto">{(["products", "categories", "customers", "suppliers", "sales", "purchases", "invoices", "expenses", "movements"] as const).map((kind) => searchResults[kind]?.length ? <div key={kind}><div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{kind}</div>{searchResults[kind].map((item: any) => { const routes: Record<string, string> = { products: "/products", categories: "/categories", customers: "/clients", suppliers: "/suppliers", sales: "/sales", purchases: "/purchases", invoices: "/factures", expenses: "/depenses", movements: "/movements" }; const label = item.name || item.title || item.invoiceNumber || item.reference || item.message; return <button key={item.id} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted" onClick={() => { setSearch(""); setSearchResults(null); router.push(routes[kind]) }}>{label}</button> })}</div> : null)}</div>}</div>}
        <div className="ml-1 hidden h-7 w-px bg-border sm:block" />
        <button className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-muted">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
            {persistedUser ? `${persistedUser.firstName?.charAt(0) ?? ''}${persistedUser.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'U' : 'U'}
          </div>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  )
}

interface AppShellProps {
  activeItem: string
  onNavClick: (item: string) => void
  children: React.ReactNode
  dark: boolean
  onThemeChange?: (dark: boolean) => void
}

export function AppShell({ activeItem, onNavClick, children, dark, onThemeChange }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleThemeToggle = () => {
    const newDark = !dark
    document.documentElement.classList.toggle("dark", newDark)
    onThemeChange?.(newDark)
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar activePath={activeItem} onNavClick={onNavClick} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} dark={dark} />
      {sidebarOpen && <button aria-label="Fermer le menu" className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="min-w-0 lg:pl-[244px]">
        <Header title={activeItem} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} dark={dark} onThemeToggle={handleThemeToggle} />
        {children}
      </main>
    </div>
  )
}
