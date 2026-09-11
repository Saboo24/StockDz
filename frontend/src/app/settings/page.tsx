"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Save } from "lucide-react"
import { toast } from "sonner"
import { logout } from "@/lib/api/auth"
import { getCompanySettings, updateCompanySettings } from "@/lib/api/settings"
import { useAuth } from "@/app/provider"

export default function SettingsPage() {
  const router = useRouter()
  const { user, clearSession } = useAuth()
  const [dark, setDark] = useState(false)
  const [company, setCompany] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const currentUser = user ?? { firstName: '', lastName: '', email: '' }

  useEffect(() => {
    getCompanySettings().then((data) => {
      setCompany(data.company || {})
    }).catch(() => {
      setCompany({})
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateCompanySettings({ name: company.name, email: company.email, phone: company.phone, address: company.address })
      toast.success("Paramètres sauvegardés")
    } catch (error: any) {
      toast.error(error.message || "Impossible de sauvegarder")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell activeItem="Paramètres" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[800px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <h1 className="text-2xl font-semibold mb-8">Paramètres</h1>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Informations Entreprise</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de l&apos;entreprise</label>
                <input type="text" value={company.name || ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="w-full px-3 py-2 rounded border border-border/70 bg-card" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={company.email || ''} onChange={(e) => setCompany({ ...company, email: e.target.value })} className="w-full px-3 py-2 rounded border border-border/70 bg-card" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Téléphone</label>
                <input type="text" value={company.phone || ''} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className="w-full px-3 py-2 rounded border border-border/70 bg-card" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Adresse</label>
                <input type="text" value={company.address || ''} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="w-full px-3 py-2 rounded border border-border/70 bg-card" />
              </div>
              <div className="pt-4">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="size-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base">Compte Utilisateur</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom complet</label>
                <input type="text" value={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()} readOnly className="w-full px-3 py-2 rounded border border-border/70 bg-card opacity-80" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={currentUser.email || ''} readOnly className="w-full px-3 py-2 rounded border border-border/70 bg-card opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="border-b border-red-500/20">
              <CardTitle className="text-base text-red-600">Zone Dangereuse</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Déconnectez-vous de votre compte StockDz</p>
              <Button variant="destructive" className="gap-2" onClick={async () => { await logout(); clearSession(); router.replace('/login') }}>
                <LogOut className="size-4" />
                Déconnectez-vous
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
