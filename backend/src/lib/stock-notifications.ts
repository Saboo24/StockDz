import { prisma } from './prisma'

export async function syncStockNotification(companyId: string, product: { id: string; name: string; stock: number; minStock: number }) {
  if (product.stock === 0) {
    await prisma.notification.upsert({
      where: { companyId_dedupeKey: { companyId, dedupeKey: `stock:out:${product.id}` } },
      update: { isRead: false, message: `${product.name} est en rupture de stock.` },
      create: { companyId, type: 'out_of_stock', title: 'Rupture de stock', message: `${product.name} est en rupture de stock.`, dedupeKey: `stock:out:${product.id}` },
    })
  } else if (product.stock <= product.minStock) {
    await prisma.notification.upsert({
      where: { companyId_dedupeKey: { companyId, dedupeKey: `stock:low:${product.id}` } },
      update: { isRead: false, message: `${product.name}: ${product.stock} unité(s) restante(s).` },
      create: { companyId, type: 'low_stock', title: 'Stock faible', message: `${product.name}: ${product.stock} unité(s) restante(s).`, dedupeKey: `stock:low:${product.id}` },
    })
  }
}
