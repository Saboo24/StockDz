"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Package, ShoppingCart, Wallet, AlertTriangle } from "lucide-react"
import { getDashboardSummary } from "@/lib/api/dashboard"
import { formatCurrency, getStoredLanguage } from "@/lib/i18n"

export default function Dashboard() {
  const language = getStoredLanguage()
  const [dark, setDark] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    getDashboardSummary()
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
  }, [])

  const chartData = useMemo(() => {
    const products = summary?.products ?? []
    return products.slice(0, 7).map((product: any, index: number) => ({
      name: product.name?.slice(0, 10) ?? `P${index + 1}`,
      ventes: Math.max(0, Number(product.sellPrice || 0) * Math.max(1, product.stock || 0) / 1000),
      achats: Math.max(0, Number(product.buyPrice || 0) * Math.max(1, product.stock || 0) / 1000),
    }))
  }, [summary])

  const metrics = summary?.metrics ?? {}
  const lowStock = summary?.lowStockProducts ?? []
  const notifications = summary?.notifications ?? []
  const recentSales = summary?.recentSales ?? []

  const kpis = [
    { title: language === 'fr' ? 'Ventes totales' : 'Total Sales', value: formatCurrency(metrics.totalRevenue || 0), change: language === 'fr' ? 'données en direct' : 'live data', icon: TrendingUp, color: "text-emerald-600" },
    { title: language === 'fr' ? 'Stock total' : 'Total Stock', value: `${summary?.summary?.totalStock ?? 0}` , change: language === 'fr' ? 'unités' : 'units', icon: Package, color: "text-blue-600" },
    { title: language === 'fr' ? 'Achats' : 'Purchases', value: formatCurrency(metrics.totalExpenses || 0), change: language === 'fr' ? 'données en direct' : 'live data', icon: ShoppingCart, color: "text-purple-600" },
    { title: language === 'fr' ? 'Solde' : 'Balance', value: formatCurrency(metrics.netProfit || 0), change: language === 'fr' ? 'bénéfice net' : 'net profit', icon: Wallet, color: "text-amber-600" },
  ]

  return (
    <AppShell activeItem="Tableau de Bord" onNavClick={() => {}} dark={dark} onThemeChange={setDark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">{language === 'fr' ? 'Tableau de bord' : 'Dashboard'}</h1>
          <p className="text-muted-foreground mt-1">{language === 'fr' ? 'Bienvenue dans StockDz, votre plateforme de gestion.' : 'Welcome to StockDz — your inventory management platform'}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon
            return (
              <Card key={i} className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.title}</p>
                      <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                      <p className="text-xs text-emerald-600 mt-2">{kpi.change}</p>
                    </div>
                    <Icon className={`size-8 ${kpi.color}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="border-border/70 lg:col-span-2">
            <CardHeader className="border-b border-border/60">
              <CardTitle>Tendances Ventes vs Achats</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ventes" stroke="#facc15" strokeWidth={2} />
                  <Line type="monotone" dataKey="achats" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Alertes Stock</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {lowStock.length === 0 ? (
                <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Aucune alerte de stock pour l&apos;instant.' : 'No stock alerts right now.'}</div>
              ) : lowStock.slice(0, 3).map((product: any) => (
                <div key={product.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.stock} restant(s) — seuil {product.minStock ?? 0}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {notifications.length === 0 ? (
                <div className="px-6 py-4 text-sm text-muted-foreground">{language === 'fr' ? 'Aucune notification récente.' : 'No recent notifications.'}</div>
              ) : notifications.map((item: any) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.message.replace(/\sDA\b/g, ' DZA')}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('fr-DZ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
