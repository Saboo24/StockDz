"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Search, Filter, Edit, Trash, Eye } from "lucide-react"
import { toast } from "sonner"
import { getStoredToken } from "@/lib/api"
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "@/lib/api/products"
import { getCategories } from "@/lib/api/categories"
import { formatCurrency } from "@/lib/i18n"

type ProductFormState = {
  sku: string
  name: string
  categoryId: string
  barcode: string
  description: string
  buyPrice: string
  sellPrice: string
  stock: string
  minStock: string
  unit: string
}

const makeEmptyForm = (): ProductFormState => ({
  sku: "",
  name: "",
  categoryId: "",
  barcode: "",
  description: "",
  buyPrice: "",
  sellPrice: "",
  stock: "0",
  minStock: "0",
  unit: "pièce",
})

export default function ProductsPage() {
  const [dark, setDark] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [form, setForm] = useState<ProductFormState>(makeEmptyForm())
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.categories || [])
    } catch {
      setCategories([])
    }
  }

  const loadProducts = async (search = searchTerm, category = categoryFilter) => {
    const token = getStoredToken()
    if (!token) {
      setProducts([])
      return
    }

    try {
      const data = await getProducts({
        search: search.trim(),
        categoryId: category === 'all' ? undefined : category,
      })
      setProducts(data.products || [])
    } catch {
      setProducts([])
    }
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(searchTerm, categoryFilter)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchTerm, categoryFilter])

  const getStatusColor = (stock: number) => {
    if (stock <= 0) return "bg-red-500/12 text-red-600 dark:text-red-400"
    if (stock <= 5) return "bg-amber-500/12 text-amber-600 dark:text-amber-400"
    return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
  }

  const getStatusLabel = (stock: number) => {
    if (stock <= 0) return "Rupture"
    if (stock <= 5) return "Stock faible"
    return "En stock"
  }

  const openCreateForm = () => {
    setEditingProductId(null)
    setForm(makeEmptyForm())
    setIsFormOpen(true)
  }

  const openEditForm = (product: any) => {
    setEditingProductId(product.id)
    setForm({
      sku: product.sku || "",
      name: product.name || "",
      categoryId: product.categoryId || "",
      barcode: product.barcode || "",
      description: product.description || "",
      buyPrice: String(product.buyPrice ?? ""),
      sellPrice: String(product.sellPrice ?? ""),
      stock: String(product.stock ?? 0),
      minStock: String(product.minStock ?? 0),
      unit: product.unit || "pièce",
    })
    setIsFormOpen(true)
  }

  const openDetails = async (product: any) => {
    try {
      const data = await getProduct(product.id)
      setSelectedProduct(data.product)
      setIsDetailsOpen(true)
    } catch {
      toast.error("Impossible de charger les détails du produit.")
    }
  }

  const onDelete = async (product: any) => {
    const confirmed = window.confirm(`Supprimer le produit ${product.name} ?`)
    if (!confirmed) return

    try {
      await deleteProduct(product.id)
      toast.success("Produit supprimé")
      await loadProducts()
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer le produit.")
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Le nom et la référence du produit sont obligatoires.")
      return
    }

    try {
      setSaving(true)
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0),
        unit: form.unit || "pièce",
      }

      if (editingProductId) {
        await updateProduct(editingProductId, payload)
        toast.success("Produit mis à jour")
      } else {
        await createProduct(payload)
        toast.success("Produit créé")
      }

      setIsFormOpen(false)
      setForm(makeEmptyForm())
      setEditingProductId(null)
      await loadProducts()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const displayedProducts = useMemo(() => products, [products])

  return (
    <AppShell activeItem="Produits" onNavClick={() => {}} dark={dark} onThemeChange={setDark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>StockDz</span>
              <span>›</span>
              <span className="text-foreground font-medium">Produits</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Gestion des Produits</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Gérez votre catalogue de produits</p>
          </div>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="size-4" />
            Ajouter un produit
          </Button>
        </div>

        <div className="mb-6 flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-muted-foreground">
            <Search className="size-4" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2 py-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none"
            >
              <option value="all">Toutes</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!getStoredToken() ? (
          <Card className="border-border/70"><CardContent className="p-6 text-sm text-muted-foreground">Connectez-vous pour voir les produits réels de votre entreprise.</CardContent></Card>
        ) : (
        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Tous les produits ({displayedProducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-6 py-3 text-left font-semibold">Produit</th>
                    <th className="px-6 py-3 text-left font-semibold">Référence</th>
                    <th className="px-6 py-3 text-left font-semibold">Catégorie</th>
                    <th className="px-6 py-3 text-left font-semibold">Stock</th>
                    <th className="px-6 py-3 text-left font-semibold">Prix d&apos;achat</th>
                    <th className="px-6 py-3 text-left font-semibold">Prix de vente</th>
                    <th className="px-6 py-3 text-left font-semibold">Statut</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/60 hover:bg-muted/30 transition">
                      <td className="px-6 py-3.5 font-medium">{product.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{product.sku}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{product.category?.name || '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold">{product.stock}</span>
                        <span className="text-muted-foreground text-xs ml-1">unités</span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs">{formatCurrency(product.buyPrice || 0)}</td>
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold">{formatCurrency(product.sellPrice || 0)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(product.stock)}`}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {getStatusLabel(product.stock)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openDetails(product)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Voir le produit">
                            <Eye className="size-4" />
                          </button>
                          <button onClick={() => openEditForm(product)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Modifier le produit">
                            <Edit className="size-4" />
                          </button>
                          <button onClick={() => onDelete(product)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-600" aria-label="Supprimer le produit">
                            <Trash className="size-4" />
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
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Affichage de {displayedProducts.length} produits</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Précédent</Button>
            <Button variant="outline" size="sm">Suivant</Button>
          </div>
        </div>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingProductId ? "Modifier le produit" : "Ajouter un produit"}</SheetTitle>
            <SheetDescription>
              {editingProductId ? "Mettez à jour le produit sélectionné." : "Créez un produit réel dans votre entreprise."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="product-name">Nom du produit</Label>
                <Input id="product-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-sku">Référence</Label>
                <Input id="product-sku" value={form.sku} onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-category">Catégorie</Label>
                <select
                  id="product-category"
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Aucune</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-barcode">Code-barres</Label>
                <Input id="product-barcode" value={form.barcode} onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-buy-price">Prix d&apos;achat</Label>
                <Input id="product-buy-price" type="number" min="0" value={form.buyPrice} onChange={(e) => setForm((prev) => ({ ...prev, buyPrice: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-sell-price">Prix de vente</Label>
                <Input id="product-sell-price" type="number" min="0" value={form.sellPrice} onChange={(e) => setForm((prev) => ({ ...prev, sellPrice: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock</Label>
                <Input id="product-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-min-stock">Stock minimum</Label>
                <Input id="product-min-stock" type="number" min="0" value={form.minStock} onChange={(e) => setForm((prev) => ({ ...prev, minStock: e.target.value }))} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="product-unit">Unité</Label>
                <Input id="product-unit" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="product-description">Description</Label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : editingProductId ? "Enregistrer" : "Créer"}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Détails du produit</SheetTitle>
            <SheetDescription>Informations complètes du produit.</SheetDescription>
          </SheetHeader>

          {selectedProduct ? (
            <div className="space-y-4 px-4 pb-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Produit</div>
                <div className="mt-1 text-xl font-semibold">{selectedProduct.name}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Référence</div>
                  <div className="mt-1 font-medium">{selectedProduct.sku}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Catégorie</div>
                  <div className="mt-1 font-medium">{selectedProduct.category?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Stock</div>
                  <div className="mt-1 font-medium">{selectedProduct.stock}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Stock min</div>
                  <div className="mt-1 font-medium">{selectedProduct.minStock}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Achat</div>
                  <div className="mt-1 font-medium">{Number(selectedProduct.buyPrice || 0).toLocaleString('fr-DZ')} DZA</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vente</div>
                  <div className="mt-1 font-medium">{Number(selectedProduct.sellPrice || 0).toLocaleString('fr-DZ')} DZA</div>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Code-barres</div>
                <div className="mt-1">{selectedProduct.barcode || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Description</div>
                <div className="mt-1 text-muted-foreground">{selectedProduct.description || 'Aucune description.'}</div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
