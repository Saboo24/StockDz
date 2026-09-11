"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Plus, Search, Edit, Trash, Phone, Mail, MapPin, Eye } from "lucide-react"
import { toast } from "sonner"
import { createSupplier, deleteSupplier, getSupplier, getSuppliers, updateSupplier } from "@/lib/api/suppliers"
import { getStoredToken } from "@/lib/api"

type SupplierFormState = {
  name: string
  email: string
  phone: string
  address: string
}

const emptySupplierForm = (): SupplierFormState => ({
  name: "",
  email: "",
  phone: "",
  address: "",
})

export default function SuppliersPage() {
  const [dark, setDark] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null)
  const [form, setForm] = useState<SupplierFormState>(emptySupplierForm())
  const [saving, setSaving] = useState(false)

  const loadSuppliers = async () => {
    const token = getStoredToken()
    if (!token) {
      setSuppliers([])
      return
    }

    try {
      const data = await getSuppliers()
      setSuppliers(data.suppliers || [])
    } catch {
      setSuppliers([])
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return suppliers
    return suppliers.filter((supplier) => `${supplier.name ?? ''} ${supplier.email ?? ''} ${supplier.phone ?? ''}`.toLowerCase().includes(query))
  }, [suppliers, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptySupplierForm())
    setIsFormOpen(true)
  }

  const openEdit = (supplier: any) => {
    setEditingId(supplier.id)
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    })
    setIsFormOpen(true)
  }

  const openView = async (supplier: any) => {
    try {
      const data = await getSupplier(supplier.id)
      setSelectedSupplier(data.supplier)
      setIsDetailsOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger le fournisseur.")
    }
  }

  const handleDelete = async (supplier: any) => {
    const ok = window.confirm(`Supprimer le fournisseur ${supplier.name} ?`)
    if (!ok) return

    try {
      await deleteSupplier(supplier.id)
      toast.success("Fournisseur supprimé")
      await loadSuppliers()
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer le fournisseur.")
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.")
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      }

      if (editingId) {
        await updateSupplier(editingId, payload)
        toast.success("Fournisseur mis à jour")
      } else {
        await createSupplier(payload)
        toast.success("Fournisseur créé")
      }

      setIsFormOpen(false)
      setForm(emptySupplierForm())
      setEditingId(null)
      await loadSuppliers()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell activeItem="Fournisseurs" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Gestion des Fournisseurs</h1>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un fournisseur..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((supplier) => (
            <Card key={supplier.id} className="border-border/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-xs text-muted-foreground">Fournisseur</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openView(supplier)} className="p-1 rounded hover:bg-muted" aria-label="Voir">
                      <Eye className="size-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => openEdit(supplier)} className="p-1 rounded hover:bg-muted" aria-label="Modifier">
                      <Edit className="size-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(supplier)} className="p-1 rounded hover:bg-red-500/10" aria-label="Supprimer">
                      <Trash className="size-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3" />{supplier.phone || '—'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3" />{supplier.email || '—'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3" />{supplier.address || '—'}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingId ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Mettez à jour les informations du fournisseur." : "Enregistrez un nouveau fournisseur pour votre entreprise."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Nom</Label>
              <Input id="supplier-name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ex : Fournisseur Test" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input id="supplier-email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Téléphone</Label>
              <Input id="supplier-phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+213 ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">Adresse</Label>
              <Input id="supplier-address" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Adresse" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer"}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>Détails du fournisseur</SheetTitle>
            <SheetDescription>Informations complètes du fournisseur.</SheetDescription>
          </SheetHeader>
          {selectedSupplier ? (
            <div className="space-y-4 px-4 pb-4 text-sm">
              <div>
                <div className="text-muted-foreground">Nom</div>
                <div className="font-medium text-foreground">{selectedSupplier.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{selectedSupplier.email || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Téléphone</div>
                <div>{selectedSupplier.phone || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Adresse</div>
                <div>{selectedSupplier.address || '—'}</div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
