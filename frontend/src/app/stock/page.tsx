"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, Zap, Search, Plus, Minus, ArrowDownLeft, ArrowUpRight, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { createStockMovement, getStockOverview, setInitialStock } from "@/lib/api/stock"
import { formatCurrency } from "@/lib/i18n"

const operationOptions = [
  { key: "INITIAL", label: "Stock initial", icon: Plus },
  { key: "IN", label: "Entrée", icon: ArrowDownLeft },
  { key: "OUT", label: "Sortie", icon: ArrowUpRight },
  { key: "ADJUSTMENT", label: "Ajustement", icon: RefreshCcw },
  { key: "RETURN", label: "Retour", icon: RefreshCcw },
] as const

export default function StockPage() {
  const [dark, setDark] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [operationType, setOperationType] = useState<(typeof operationOptions)[number]["key"]>("IN")
  const [quantity, setQuantity] = useState("1")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const loadProducts = async () => {
    try {
      const data = await getStockOverview()
      setProducts(data.products || [])
      if (!selectedProductId && (data.products || []).length > 0) {
        setSelectedProductId((data.products || [])[0].id)
      }
    } catch {
      setProducts([])
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => `${product.name} ${product.sku ?? ''}`.toLowerCase().includes(query))
  }, [products, search])

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null

  const totalUnits = products.reduce((sum, item) => sum + Number(item.stock || 0), 0)
  const lowStock = products.filter((item) => Number(item.stock || 0) <= Number(item.minStock || 0) || Number(item.stock || 0) <= 5)
  const outOfStock = products.filter((item) => Number(item.stock || 0) <= 0)
  const inventoryValue = products.reduce((sum, item) => sum + Number(item.sellPrice || 0) * Number(item.stock || 0), 0)

  const stockOverview = [
    { title: "Total inventory value", value: formatCurrency(inventoryValue), trend: "real inventory", icon: Package, tone: "blue" },
    { title: "Products in stock", value: String(products.length), trend: `${totalUnits} units`, icon: Package, tone: "green" },
    { title: "Low stock", value: `${lowStock.length} products`, trend: "critical threshold", icon: AlertTriangle, tone: "amber" },
    { title: "Out of stock", value: `${outOfStock.length} item(s)`, trend: "needs replenishment", icon: Zap, tone: "red" },
  ]

  const handleSubmit = async () => {
    if (!selectedProductId) {
      toast.error("Sélectionnez un produit.")
      return
    }

    const parsed = Number(quantity)
    if (!Number.isFinite(parsed) || parsed === 0) {
      toast.error("La quantité doit être valide et non nulle.")
      return
    }

    setSaving(true)
    try {
      if (operationType === "INITIAL") {
        if (parsed < 0) {
          toast.error("Le stock initial ne peut pas être négatif.")
          return
        }
        await setInitialStock({
          productId: selectedProductId,
          quantity: parsed,
          reference: reference || undefined,
          notes: notes || `Stock initial pour ${selectedProduct?.name ?? 'produit'}`,
        })
        toast.success("Stock initial enregistré")
      } else {
        await createStockMovement({
          productId: selectedProductId,
          type: operationType,
          quantity: parsed,
          reference: reference || undefined,
          notes: notes || undefined,
        })
        toast.success("Mouvement de stock enregistré")
      }

      setReference("")
      setNotes("")
      setQuantity("1")
      await loadProducts()
    } catch (error: any) {
      toast.error(error.message || "Impossible de mettre à jour le stock.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell activeItem="Stock" onNavClick={() => {}} dark={dark} onThemeChange={setDark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>StockDz</span>
            <span>›</span>
            <span className="text-foreground font-medium">Stock</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Vue d&apos;ensemble du Stock</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Suivez l&apos;état de votre inventaire en temps réel</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
          {stockOverview.map((kpi, i) => {
            const Icon = kpi.icon
            const toneClasses = {
              amber: "bg-primary/12 text-primary",
              green: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
              red: "bg-red-500/12 text-red-600 dark:text-red-400",
              blue: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
            }
            return (
              <Card key={i} className="group border-border/70 shadow-sm hover:shadow-md transition">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <span className={`flex size-9 items-center justify-center rounded-lg ${toneClasses[kpi.tone as keyof typeof toneClasses]}`}>
                      <Icon className="size-[18px]" />
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">{kpi.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{kpi.trend}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="mb-6 border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Mouvement de stock</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1.5fr]">
              <div className="space-y-3">
                <label className="block text-sm font-medium">Produit</label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  {selectedProduct ? (
                    <>
                      <div className="font-medium text-foreground">{selectedProduct.name}</div>
                      <div>Stock actuel : <span className="font-semibold text-foreground">{selectedProduct.stock}</span></div>
                    </>
                  ) : 'Aucun produit disponible'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {operationOptions.map((option) => {
                    const Icon = option.icon
                    const active = operationType === option.key
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setOperationType(option.key)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 bg-background text-foreground hover:bg-muted/30'}`}
                      >
                        <Icon className="size-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Quantité</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Référence</label>
                    <input
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="INV-1001"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Ajouter une note..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Enregistrement...' : operationType === 'INITIAL' ? 'Enregistrer le stock initial' : 'Appliquer le mouvement'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-muted-foreground">
          <Search className="size-4" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un produit..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm font-semibold">Produits en stock faible</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {lowStock.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-muted-foreground">Aucun produit en stock faible.</div>
                ) : filteredProducts.filter((item) => Number(item.stock || 0) <= Number(item.minStock || 0) || Number(item.stock || 0) <= 5).slice(0, 5).map((item, i) => (
                  <div key={item.id ?? i} className="flex items-center justify-between px-6 py-3.5 border-b border-border/60 last:border-0 hover:bg-muted/30 transition">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">{item.stock} / {item.minStock || 0}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{Math.max((item.minStock || 0) - Number(item.stock || 0), 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm font-semibold">Ruptures de stock</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {outOfStock.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-muted-foreground">Aucune rupture de stock.</div>
                ) : filteredProducts.filter((item) => Number(item.stock || 0) <= 0).slice(0, 5).map((item, i) => (
                  <div key={item.id ?? i} className="flex items-center justify-between px-6 py-3.5 border-b border-border/60 last:border-0 hover:bg-muted/30 transition">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedProductId(item.id); setOperationType('IN'); }}>Réapprovisionner</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
