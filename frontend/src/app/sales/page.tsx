"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Search, Filter, Edit, Trash, Eye, Minus } from "lucide-react"
import { toast } from "sonner"
import { getStoredToken } from "@/lib/api"
import { createSale, deleteSale, getSale, getSales, updateSale } from "@/lib/api/sales"
import { getProducts } from "@/lib/api/products"
import { getCustomers } from "@/lib/api/customers"

type SaleItemForm = { productId: string; quantity: string; unitPrice: string }
type SaleForm = {
  customerId: string
  invoiceNumber: string
  note: string
  items: SaleItemForm[]
}

const emptyItem = (): SaleItemForm => ({ productId: "", quantity: "1", unitPrice: "" })
const emptyForm = (): SaleForm => ({ customerId: "", invoiceNumber: `VTE-${Date.now()}`, note: "", items: [emptyItem()] })

export default function SalesPage() {
  const [dark, setDark] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sales, setSales] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any | null>(null)
  const [form, setForm] = useState<SaleForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null)

  const loadSales = async () => {
    if (!getStoredToken()) return setSales([])
    try {
      setSales((await getSales()).sales || [])
    } catch (error: any) {
      setSales([])
      toast.error(error.message || "Impossible de charger les ventes.")
    }
  }

  useEffect(() => {
    loadSales()
    Promise.all([getCustomers(), getProducts()])
      .then(([customerData, productData]) => {
        setCustomers(customerData.customers || [])
        setProducts(productData.products || [])
      })
      .catch((error: any) => toast.error(error.message || "Impossible de charger les données."))
  }, [])

  const filteredSales = useMemo(
    () =>
      sales.filter((sale) =>
        `${sale.invoiceNumber ?? ""} ${sale.customer?.name ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [sales, searchTerm],
  )

  const updateItem = (index: number, field: keyof SaleItemForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        if (field === "productId") {
          const product = products.find((currentProduct) => currentProduct.id === value)
          return { ...item, productId: value, unitPrice: product ? String(product.sellPrice) : item.unitPrice }
        }
        return { ...item, [field]: value }
      }),
    }))
  }

  const addItem = () => setForm((previous) => ({ ...previous, items: [...previous.items, emptyItem()] }))

  const removeItem = (index: number) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.length === 1 ? [emptyItem()] : previous.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const openCreate = () => {
    setEditingSaleId(null)
    setForm(emptyForm())
    setIsFormOpen(true)
  }

  const openEdit = async (sale: any) => {
    try {
      const response = await getSale(sale.id)
      const data = response.sale
      setEditingSaleId(data.id)
      setForm({
        customerId: data.customerId || "",
        invoiceNumber: data.invoiceNumber,
        note: data.note || "",
        items: (data.items && data.items.length > 0 ? data.items : [emptyItem()]).map((item: any) => ({
          productId: item.productId,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
        })),
      })
      setIsFormOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger la vente.")
    }
  }

  const openDetails = async (sale: any) => {
    try {
      setSelectedSale((await getSale(sale.id)).sale)
      setIsDetailsOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger la vente.")
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const items = form.items.filter((item) => item.productId && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0)
    if (!form.customerId || !form.invoiceNumber.trim() || items.length === 0) {
      toast.error("Client, référence et au moins un produit valide sont obligatoires.")
      return
    }

    const payload = {
      customerId: form.customerId,
      invoiceNumber: form.invoiceNumber.trim(),
      note: form.note.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    }

    try {
      setSaving(true)
      if (editingSaleId) {
        await updateSale(editingSaleId, payload)
        toast.success("Vente mise à jour")
      } else {
        await createSale(payload)
        toast.success("Vente créée et stock mis à jour")
      }
      setIsFormOpen(false)
      setEditingSaleId(null)
      await loadSales()
    } catch (error: any) {
      toast.error(error.message || "Impossible d'enregistrer la vente.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sale: any) => {
    if (!window.confirm(`Supprimer la vente ${sale.invoiceNumber} ?`)) return
    try {
      await deleteSale(sale.id)
      toast.success("Vente supprimée")
      await loadSales()
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer la vente.")
    }
  }

  const total = form.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return sum + quantity * unitPrice
  }, 0)

  return (
    <AppShell activeItem="Ventes" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>StockDz</span>
              <span>›</span>
              <span className="font-medium text-foreground">Ventes</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Gestion des Ventes</h1>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Nouvelle vente
          </Button>
        </div>

        <div className="mb-6 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher une vente..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 bg-transparent text-foreground outline-none"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" />
          </Button>
        </div>

        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Ventes récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-6 py-3 text-left font-semibold">Référence</th>
                    <th className="px-6 py-3 text-left font-semibold">Client</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Montant</th>
                    <th className="px-6 py-3 text-left font-semibold">Statut</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary">{sale.invoiceNumber}</td>
                      <td className="px-6 py-3.5 font-medium">{sale.customer?.name || "—"}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("fr-DZ") : "—"}
                      </td>
                        <td className="px-6 py-3.5 font-semibold">{Number(sale.total || 0).toLocaleString("fr-DZ")} DZA</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          <span className="size-1.5 rounded-full bg-current" />
                          {sale.status || "paid"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openDetails(sale)} className="rounded p-1 hover:bg-muted" aria-label="Voir">
                            <Eye className="size-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => openEdit(sale)} className="rounded p-1 hover:bg-muted" aria-label="Modifier">
                            <Edit className="size-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(sale)} className="rounded p-1 hover:bg-red-500/10" aria-label="Supprimer">
                            <Trash className="size-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{editingSaleId ? "Modifier la vente" : "Nouvelle vente"}</SheetTitle>
            <SheetDescription>Ajoutez ou modifiez une vente avec plusieurs produits.</SheetDescription>
          </SheetHeader>

          <form onSubmit={submit} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="sale-invoice">Référence</Label>
              <Input
                id="sale-invoice"
                value={form.invoiceNumber}
                onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale-customer">Client</Label>
              <select
                id="sale-customer"
                value={form.customerId}
                onChange={(event) => setForm({ ...form, customerId: event.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sélectionner un client</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produits</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                  <Plus className="size-4" />
                  Ajouter
                </Button>
              </div>

              {form.items.map((item, index) => (
                <div key={`${item.productId || "new"}-${index}`} className="rounded-lg border border-border/70 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Produit {index + 1}</span>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-500/10"
                      >
                        <Minus className="size-3.5" />
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.9fr]">
                    <div className="space-y-2">
                      <Label>Produit</Label>
                      <select
                        value={item.productId}
                        onChange={(event) => updateItem(index, "productId", event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.stock} en stock)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Qté</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, "quantity", event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prix U.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total estimé</span>
                <span className="text-base font-semibold">{total.toLocaleString("fr-DZ")} DZA</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale-note">Note</Label>
              <Input
                id="sale-note"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Enregistrement..." : editingSaleId ? "Mettre à jour la vente" : "Enregistrer la vente"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détails de la vente</SheetTitle>
            <SheetDescription>Informations enregistrées.</SheetDescription>
          </SheetHeader>
          {selectedSale && (
            <div className="space-y-3 px-4 text-sm">
              <div>
                <span className="text-muted-foreground">Référence</span>
                <div className="font-medium">{selectedSale.invoiceNumber}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Client</span>
                <div className="font-medium">{selectedSale.customer?.name || "—"}</div>
              </div>

              {selectedSale.items?.map((item: any) => (
                <div key={item.id} className="border-t pt-3">
                  <div>{item.product?.name || item.productId}</div>
                  <div className="text-muted-foreground">
                    {item.quantity} × {Number(item.unitPrice).toLocaleString("fr-DZ")} DZA
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 font-medium">Total: {Number(selectedSale.total || 0).toLocaleString("fr-DZ")} DZA</div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
