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
import { createCustomer, deleteCustomer, getCustomer, getCustomers, updateCustomer } from "@/lib/api/customers"
import { getStoredToken } from "@/lib/api"

type CustomerFormState = {
  name: string
  email: string
  phone: string
  address: string
}

const emptyCustomerForm = (): CustomerFormState => ({
  name: "",
  email: "",
  phone: "",
  address: "",
})

export default function ClientsPage() {
  const [dark, setDark] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm())
  const [saving, setSaving] = useState(false)

  const loadCustomers = async () => {
    const token = getStoredToken()
    if (!token) {
      setClients([])
      return
    }

    try {
      const data = await getCustomers()
      setClients(data.customers || [])
    } catch {
      setClients([])
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return clients
    return clients.filter((client) => `${client.name ?? ''} ${client.email ?? ''} ${client.phone ?? ''}`.toLowerCase().includes(query))
  }, [clients, search])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyCustomerForm())
    setIsFormOpen(true)
  }

  const openEdit = (client: any) => {
    setEditingId(client.id)
    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
    })
    setIsFormOpen(true)
  }

  const openView = async (client: any) => {
    try {
      const data = await getCustomer(client.id)
      setSelectedCustomer(data.customer)
      setIsDetailsOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Impossible de charger le client.")
    }
  }

  const handleDelete = async (client: any) => {
    const ok = window.confirm(`Supprimer le client ${client.name} ?`)
    if (!ok) return

    try {
      await deleteCustomer(client.id)
      toast.success("Client supprimé")
      await loadCustomers()
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer le client.")
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("Le nom du client est obligatoire.")
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
        await updateCustomer(editingId, payload)
        toast.success("Client mis à jour")
      } else {
        await createCustomer(payload)
        toast.success("Client créé")
      }

      setIsFormOpen(false)
      setForm(emptyCustomerForm())
      setEditingId(null)
      await loadCustomers()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell activeItem="Clients" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>StockDz</span>
              <span>›</span>
              <span className="text-foreground font-medium">Clients</span>
            </div>
            <h1 className="text-2xl font-semibold">Gestion des Clients</h1>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Ajouter un client
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Card key={client.id} className="border-border/70 hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{client.name}</h3>
                    <p className="text-xs text-muted-foreground">Client</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openView(client)} className="p-1 rounded hover:bg-muted" aria-label="Voir">
                      <Eye className="size-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => openEdit(client)} className="p-1 rounded hover:bg-muted" aria-label="Modifier">
                      <Edit className="size-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(client)} className="p-1 rounded hover:bg-red-500/10" aria-label="Supprimer">
                      <Trash className="size-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="size-3" />{client.phone || '—'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="size-3" />{client.email || '—'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-3" />{client.address || '—'}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingId ? "Modifier le client" : "Ajouter un client"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Mettez à jour les informations du client." : "Enregistrez un nouveau client pour votre entreprise."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nom</Label>
              <Input id="customer-name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Ex : Client Test" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Téléphone</Label>
              <Input id="customer-phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="+213 ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Adresse</Label>
              <Input id="customer-address" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} placeholder="Adresse" />
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
            <SheetTitle>Détails du client</SheetTitle>
            <SheetDescription>Informations complètes du client.</SheetDescription>
          </SheetHeader>
          {selectedCustomer ? (
            <div className="space-y-4 px-4 pb-4 text-sm">
              <div>
                <div className="text-muted-foreground">Nom</div>
                <div className="font-medium text-foreground">{selectedCustomer.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{selectedCustomer.email || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Téléphone</div>
                <div>{selectedCustomer.phone || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Adresse</div>
                <div>{selectedCustomer.address || '—'}</div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}
