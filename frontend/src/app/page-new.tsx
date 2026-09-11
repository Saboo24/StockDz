"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Package, ShoppingCart, Wallet, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function Dashboard() {
  const [dark, setDark] = useState(false)

  const chartData = [
    { name: "Lun", ventes: 45000, achats: 32000 },
    { name: "Mar", ventes: 52000, achats: 38000 },
    { name: "Mer", ventes: 48000, achats: 35000 },
    { name: "Jeu", ventes: 61000, achats: 42000 },
    { name: "Ven", ventes: 55000, achats: 40000 },
    { name: "Sam", ventes: 67000, achats: 45000 },
    { name: "Dim", ventes: 42000, achats: 28000 },
  ]

  const kpis = [
    { title: "Ventes Totales", value: "2.85M", change: "+12.5%", icon: TrendingUp, color: "text-emerald-600" },
    { title: "Stock Total", value: "156 produits", change: "3 en alerte", icon: Package, color: "text-blue-600" },
    { title: "Achats", value: "1.52M", change: "+8.3%", icon: ShoppingCart, color: "text-purple-600" },
    { title: "Solde", value: "1.33M DZA", change: "+5.2%", icon: Wallet, color: "text-amber-600" },
  ]

  return (
    <AppShell activeItem="Tableau de Bord" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">Tableau de Bord</h1>
          <p className="text-muted-foreground mt-1">Bienvenue dans StockDz - Votre plateforme de gestion de stocks</p>
        </div>

        {/* KPI Cards */}
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

        {/* Charts and Alerts */}
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
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Souris Logitech</p>
                  <p className="text-xs text-muted-foreground">5 restant (seuil: 10)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Clavier Mécanique</p>
                  <p className="text-xs text-muted-foreground">Rupture de stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {[
                { action: "Vente créée", ref: "VTE-2024-00842", time: "Il y a 2 heures", user: "Utilisateur" },
                { action: "Achat reçu", ref: "ACH-2024-00521", time: "Il y a 5 heures", user: "Admin" },
                { action: "Stock ajusté", ref: "MOV-2024-00156", time: "Il y a 1 jour", user: "Utilisateur" },
              ].map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.ref} • {item.user}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
