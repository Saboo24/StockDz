"use client"

import { useEffect, useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { getStockMovements } from "@/lib/api/stock"

const TYPE_LABELS: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  ADJUSTMENT: "Ajustement",
  RETURN: "Retour",
}

export default function MovementsPage() {
  const [dark, setDark] = useState(false)
  const [movements, setMovements] = useState<any[]>([])

  useEffect(() => {
    getStockMovements()
      .then((data) => setMovements(data.movements || []))
      .catch(() => setMovements([]))
  }, [])

  const rows = useMemo(
    () =>
      movements.map((movement) => {
        const typeLabel = TYPE_LABELS[movement.type] || movement.type
        const isEntry = movement.type === "IN" || movement.type === "RETURN"
        const amount = Number(movement.quantity || 0)

        return {
          ...movement,
          typeLabel,
          isEntry,
          amountLabel: `${isEntry ? "+" : "-"}${amount}`,
          productName: movement.product?.name || "Produit inconnu",
          createdDate: movement.createdAt ? new Date(movement.createdAt).toLocaleString("fr-DZ") : "—",
          reference: movement.reference || movement.notes || "—",
        }
      }),
    [movements],
  )

  return (
    <AppShell activeItem="Mouvements" onNavClick={() => {}} dark={dark}>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Mouvements de Stock</h1>
        </div>

        <Card className="border-border/70">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="px-6 py-3 text-left font-semibold">Produit</th>
                    <th className="px-6 py-3 text-left font-semibold">Type</th>
                    <th className="px-6 py-3 text-left font-semibold">Quantité</th>
                    <th className="px-6 py-3 text-left font-semibold">Motif</th>
                    <th className="px-6 py-3 text-left font-semibold">Utilisateur</th>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        Aucun mouvement de stock pour cette entreprise.
                      </td>
                    </tr>
                  ) : (
                    rows.map((m) => (
                      <tr key={m.id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-6 py-3.5 font-medium">{m.productName}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            {m.isEntry ? (
                              <ArrowUpRight className="size-4 text-emerald-600" />
                            ) : (
                              <ArrowDownLeft className="size-4 text-red-600" />
                            )}
                            <span>{m.typeLabel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono font-semibold text-foreground">{m.amountLabel}</td>
                        <td className="px-6 py-3.5 text-muted-foreground text-xs">{m.reference}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{m.notes || "—"}</td>
                        <td className="px-6 py-3.5 text-muted-foreground text-xs">{m.createdDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
