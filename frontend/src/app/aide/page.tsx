"use client"

import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Instagram, Music2 } from 'lucide-react'
import { developerSupport } from '@/lib/support'

export default function HelpPage() {
  const contactItems = [
    { label: 'Email', value: developerSupport.email, icon: Mail, href: developerSupport.email ? `mailto:${developerSupport.email}` : undefined },
    { label: 'Instagram', value: developerSupport.instagram, icon: Instagram, href: developerSupport.instagram || undefined },
    { label: 'TikTok', value: developerSupport.tiktok, icon: Music2, href: developerSupport.tiktok || undefined },
  ]

  return (
    <AppShell activeItem="Centre d'aide" onNavClick={() => {}} dark={false}>
      <div className="mx-auto max-w-[800px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Centre d&apos;aide</h1>
          <p className="mt-1 text-sm text-muted-foreground">Besoin d&apos;aide avec StockDZ ?</p>
        </div>
        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60"><CardTitle className="text-base">Contact développeur</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="font-medium">{developerSupport.name}</p>
            {contactItems.map(({ label, value, icon: Icon, href }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-sm">
                <Icon className="size-4 text-primary" />
                <span className="text-muted-foreground">{label}</span>
                {href ? <a className="ml-auto text-primary hover:underline" href={href} target={label === 'Email' ? undefined : '_blank'} rel="noreferrer">{value}</a> : <span className="ml-auto text-muted-foreground">Non configuré</span>}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="mt-6 border-border/70">
          <CardHeader className="border-b border-border/60"><CardTitle className="text-base">Guides rapides</CardTitle></CardHeader>
          <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
            <p>Ajoutez vos produits depuis Produits, puis utilisez Stock pour suivre les quantités.</p>
            <p>Créez une vente ou un achat depuis les pages Ventes et Achats.</p>
            <p>Les factures sont générées automatiquement après une vente validée.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
