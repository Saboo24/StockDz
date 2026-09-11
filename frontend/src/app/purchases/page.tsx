"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Edit, Trash, Eye } from "lucide-react"
import { toast } from "sonner"
import { getStoredToken } from "@/lib/api"
import { createPurchase, deletePurchase, getPurchase, getPurchases, updatePurchase } from "@/lib/api/purchases"
import { getProducts } from "@/lib/api/products"
import { getSuppliers } from "@/lib/api/suppliers"

type PurchaseItemForm = { productId: string; quantity: string; unitPrice: string }
type PurchaseForm = { supplierId: string; invoiceNumber: string; note: string; items: PurchaseItemForm[] }

const emptyItem = (): PurchaseItemForm => ({ productId: "", quantity: "1", unitPrice: "" })
const emptyForm = (): PurchaseForm => ({ supplierId: "", invoiceNumber: `ACH-${Date.now()}`, note: "", items: [emptyItem()] })

export default function PurchasesPage() {
  const [dark, setDark] = useState(false)
  const [purchases, setPurchases] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null)
  const [form, setForm] = useState<PurchaseForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null)

  const loadPurchases = async () => {
    if (!getStoredToken()) return setPurchases([])
    try {
      setPurchases((await getPurchases()).purchases || [])
    } catch (error: any) {
      setPurchases([])
      toast.error(error.message || "Impossible de charger les achats.")
    }
  }

  useEffect(() => {
    loadPurchases()
    Promise.all([getSuppliers(), getProducts()])
      .then(([supplierData, productData]) => {
        setSuppliers(supplierData.suppliers || [])
        setProducts(productData.products || [])
      })
      .catch((error: any) => toast.error(error.message || "Impossible de charger les données."))
  }, [])

  const updateItem = (index: number, field: keyof PurchaseItemForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        if (field === "productId") {
          const product = products.find((currentProduct) => currentProduct.id === value)
          return { ...item, productId: value, unitPrice: product ? String(product.buyPrice) : item.unitPrice }
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
    setEditingPurchaseId(null)
    setForm(emptyForm())
    setIsFormOpen(true)
  }

  const openEdit = async (purchase: any) => {
    try {
      const response = await getPurchase(purchase.id)
      const data = response.purchase
      setEditingPurchaseId(data.id)
      setForm({
        supplierId: data.supplierId || "",
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
      toast.error(error.message || "Impossible de charger l'achat.")
    }
  }

  const openDetails = async (purchase: any) => {
    try {
      setSelectedPurchase((await getPurchase(purchase.id)).purchase)
      setIsDetailsOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger l'achat.")
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validItems = form.items.filter((item) => item.productId && Number(item.quantity) > 0 && Number(item.unitPrice) >= 0)
    if (!form.supplierId || !form.invoiceNumber.trim() || validItems.length === 0) {
      toast.error("Fournisseur, référence et au moins un produit valide sont obligatoires.")
      return
    }

    const payload = {
      supplierId: form.supplierId,
      invoiceNumber: form.invoiceNumber.trim(),
      note: form.note.trim() || undefined,
      items: validItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    }

    try {
      setSaving(true)
      if (editingPurchaseId) {
        await updatePurchase(editingPurchaseId, payload)
        toast.success("Achat mis à jour")
      } else {
        await createPurchase(payload)
        toast.success("Achat créé et stock mis à jour")
      }
      setIsFormOpen(false)
      setEditingPurchaseId(null)
      await loadPurchases()
    } catch (error: any) {
      toast.error(error.message || "Impossible d'enregistrer l'achat.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (purchase: any) => {
    if (!window.confirm(`Supprimer l'achat ${purchase.invoiceNumber} ?`)) return
    try {
      await deletePurchase(purchase.id)
      toast.success("Achat supprimé")
      await loadPurchases()
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer l'achat.")
    }
  }

  const total = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)

  return (
    <AppShell activeItem="Achats" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Gestion des Achats</h1>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Nouvel achat
          </Button>
        </div>

        <Card className="border-border/70">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-6 py-3 text-left font-semibold">Référence</th>
                    <th className="px-6 py-3 text-left font-semibold">Fournisseur</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Montant</th>
                    <th className="px-6 py-3 text-left font-semibold">Statut</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary">{purchase.invoiceNumber}</td>
                      <td className="px-6 py-3.5">{purchase.supplier?.name || "—"}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString("fr-DZ") : "—"}
                      </td>
                        <td className="px-6 py-3.5 font-semibold">{Number(purchase.total || 0).toLocaleString("fr-DZ")} DZA</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          <span className="size-1.5 rounded-full bg-current" />
                          {purchase.status || "received"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center gap-2">
                          <button type="button" onClick={() => openDetails(purchase)} className="rounded p-1 hover:bg-muted" aria-label="Voir">
                            <Eye className="size-4 text-muted-foreground" />
                          </button>
                          <button type="button" onClick={() => openEdit(purchase)} className="rounded p-1 hover:bg-muted" aria-label="Modifier">
                            <Edit className="size-4 text-muted-foreground" />
                          </button>
                          <button type="button" onClick={() => handleDelete(purchase)} className="rounded p-1 hover:bg-red-500/10" aria-label="Supprimer">
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
            <SheetTitle>{editingPurchaseId ? "Modifier l'achat" : "Nouvel achat"}</SheetTitle>
            <SheetDescription>
              {editingPurchaseId ? "Mettez à jour l'achat et son stock." : "Ajoutez un achat avec les données de votre entreprise."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={submit} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-invoice">Référence</Label>
              <Input id="purchase-invoice" value={form.invoiceNumber} onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-supplier">Fournisseur</Label>
              <select id="purchase-supplier" value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            {form.items.map((item, index) => (
              <div key={`${item.productId || "new"}-${index}`} className="rounded-lg border border-border/70 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Produit {index + 1}</span>
                  {form.items.length > 1 && (
                    <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => removeItem(index)}>
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`purchase-product-${index}`}>Produit</Label>
                  <select id={`purchase-product-${index}`} value={item.productId} onChange={(event) => updateItem(index, "productId", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Sélectionner un produit</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`purchase-quantity-${index}`}>Quantité</Label>
                    <Input id={`purchase-quantity-${index}`} type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`purchase-price-${index}`}>Prix unitaire</Label>
                    <Input id={`purchase-price-${index}`} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", event.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button type="button" onClick={addItem} className="text-sm font-medium text-primary hover:underline">
                + Ajouter un produit
              </button>
              <div className="text-sm font-semibold">Total: {total.toLocaleString("fr-DZ")} DZA</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-note">Note</Label>
              <Input id="purchase-note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (editingPurchaseId ? "Mise à jour..." : "Enregistrement...") : (editingPurchaseId ? "Enregistrer" : "Créer l'achat")}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détails de l&apos;achat</SheetTitle>
            <SheetDescription>Informations enregistrées.</SheetDescription>
          </SheetHeader>
          {selectedPurchase && (
            <div className="space-y-3 px-4 text-sm">
              <div>
                <span className="text-muted-foreground">Référence</span>
                <div className="font-medium">{selectedPurchase.invoiceNumber}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Fournisseur</span>
                <div className="font-medium">{selectedPurchase.supplier?.name || "—"}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Montant total</span>
                <div className="font-medium">{Number(selectedPurchase.total || 0).toLocaleString("fr-DZ")} DZA</div>
              </div>
              {selectedPurchase.items?.map((item: any) => (
                <div key={item.id} className="border-t pt-3">
                  <div>{item.product?.name || item.productId}</div>
                  <div className="text-muted-foreground">{item.quantity} × {Number(item.unitPrice).toLocaleString("fr-DZ")} DZA</div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
