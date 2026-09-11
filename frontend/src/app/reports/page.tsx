"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Download } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getReport, type Report } from "@/lib/api/reports"

export default function ReportsPage() {
  const [dark, setDark] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [loadingType, setLoadingType] = useState<string | null>(null)

  const reports = [
    { type: "sales", title: "Rapport de Ventes", description: "Ventes totales par période", icon: TrendingUp },
    { type: "purchases", title: "Rapport d'Achats", description: "Détail des achats effectués", icon: TrendingUp },
    { type: "stock", title: "Valeur du Stock", description: "Inventaire et valorisation", icon: BarChart3 },
    { type: "margins", title: "Marges Bénéficiaires", description: "Analyse des marges par produit", icon: TrendingUp },
    { type: "performance", title: "Performance Produits", description: "Produits les plus vendus", icon: BarChart3 },
    { type: "critical", title: "Stock Critique", description: "Produits en alerte stock", icon: TrendingUp },
  ]

  const generateReport = async (type: string) => {
    try {
      setLoadingType(type)
      setReport((await getReport(type)).report)
      setReportOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Impossible de générer le rapport.")
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <AppShell activeItem="Rapports" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Rapports et Analyses</h1>
          <p className="text-muted-foreground mt-1">Générez des rapports détaillés sur votre activité</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((item, i) => {
            const Icon = item.icon
            return (
              <Card key={i} className="border-border/70 hover:shadow-md transition cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <Icon className="size-5 text-primary" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => generateReport(item.type)}
                    disabled={loadingType === item.type}
                  >
                    <Download className="size-4" />
                    {loadingType === item.type ? "Chargement..." : "Générer"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{report?.title}</SheetTitle>
            <SheetDescription>Généré le {report ? new Date(report.generatedAt).toLocaleString("fr-DZ") : ""}</SheetDescription>
          </SheetHeader>
          {report && <div className="space-y-4 overflow-y-auto px-4 pb-6 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(report).filter(([key, value]) => ["count", "total", "totalQuantity", "totalValue", "revenue", "cost", "margin", "marginPercent"].includes(key) && typeof value === "number").map(([key, value]) => <div key={key} className="rounded-lg border border-border/70 p-3"><div className="text-xs text-muted-foreground">{key}</div><div className="mt-1 font-semibold">{Number(value).toLocaleString("fr-DZ")}{key.toLowerCase().includes("percent") ? "%" : key.toLowerCase().includes("total") || ["revenue", "cost", "margin"].includes(key) ? " DZA" : ""}</div></div>)}
            </div>
            {Array.isArray(report.rows) && report.rows.length > 0 ? <div className="overflow-x-auto rounded-lg border border-border/70"><table className="w-full text-xs"><thead><tr className="border-b bg-muted/30"><th className="px-3 py-2 text-left">Élément</th><th className="px-3 py-2 text-left">Détails</th><th className="px-3 py-2 text-right">Valeur</th></tr></thead><tbody>{report.rows.map((row: any, index: number) => { const entries = Object.entries(row); return <tr key={index} className="border-b last:border-0"><td className="px-3 py-2 font-medium">{String(row.name || row.product || row.reference || row.sku || "Élément")}</td><td className="px-3 py-2 text-muted-foreground">{entries.filter(([key]) => !["name", "product", "reference", "sku"].includes(key)).slice(0, 2).map(([key, value]) => `${key}: ${typeof value === "number" ? Number(value).toLocaleString("fr-DZ") : String(value)}`).join(" · ")}</td><td className="px-3 py-2 text-right font-medium">{row.total !== undefined ? `${Number(row.total).toLocaleString("fr-DZ")} DA` : row.revenue !== undefined ? `${Number(row.revenue).toLocaleString("fr-DZ")} DA` : row.stock !== undefined ? row.stock : "-"}</td></tr>})}</tbody></table></div> : <p className="rounded-lg border border-border/70 p-4 text-muted-foreground">Aucune donnée pour ce rapport.</p>}
          </div>}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
