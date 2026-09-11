"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Search, Pencil, Trash2, Tag } from "lucide-react"
import { toast } from "sonner"
import { createCategory, deleteCategory, getCategories, updateCategory, type Category } from "@/lib/api/categories"

const emptyForm = { name: "", color: "#2563eb" }

export default function CategoriesPage() {
  const [dark, setDark] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data.categories || [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.name.toLowerCase().includes(query))
  }, [categories, searchTerm])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingId(category.id)
    setForm({ name: category.name, color: category.color || "#2563eb" })
    setIsFormOpen(true)
  }

  const handleDelete = async (category: Category) => {
    const ok = window.confirm(`Supprimer la catégorie ${category.name} ?`)
    if (!ok) return

    try {
      await deleteCategory(category.id)
      toast.success("Catégorie supprimée")
      await loadCategories()
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer la catégorie.")
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("Le nom de la catégorie est obligatoire.")
      return
    }

    try {
      setSaving(true)
      if (editingId) {
        await updateCategory(editingId, { name: form.name.trim(), color: form.color })
        toast.success("Catégorie mise à jour")
      } else {
        await createCategory({ name: form.name.trim(), color: form.color })
        toast.success("Catégorie créée")
      }

      setIsFormOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      await loadCategories()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell activeItem="Catégories" onNavClick={() => {}} dark={dark} onThemeChange={setDark}>
      <div className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>StockDz</span>
              <span>›</span>
              <span className="font-medium text-foreground">Catégories</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Gestion des catégories</h1>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Ajouter une catégorie
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-muted-foreground">
          <Search className="size-4" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une catégorie..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Catégories ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.length === 0 ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                  Aucune catégorie trouvée.
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-9 items-center justify-center rounded-lg text-white shadow-sm"
                          style={{ backgroundColor: category.color || '#2563eb' }}
                        >
                          <Tag className="size-4" />
                        </span>
                        <div>
                          <div className="font-semibold text-foreground">{category.name}</div>
                          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{category.slug}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(category)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Modifier">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => handleDelete(category)} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600" aria-label="Supprimer">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingId ? "Modifier la catégorie" : "Ajouter une catégorie"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Mettez à jour la catégorie sélectionnée." : "Créez une catégorie pour organiser votre catalogue."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nom</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex : Électronique"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color">Couleur</Label>
              <div className="flex items-center gap-3">
                <input
                  id="category-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-16 rounded border border-input bg-transparent p-1"
                />
                <span className="text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
