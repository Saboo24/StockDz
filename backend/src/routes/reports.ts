import { Router } from 'express'
import { requireAuth, requireCompanyScope } from '../lib/auth'
import { prisma } from '../lib/prisma'

export const reportsRouter = Router()
reportsRouter.use(requireAuth, requireCompanyScope)

reportsRouter.get('/:type', async (req, res) => {
  const companyId = req.companyId!
  const type = req.params.type
  const [sales, purchases, products] = await Promise.all([
    prisma.sale.findMany({ where: { companyId }, include: { customer: true, items: { include: { product: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.purchase.findMany({ where: { companyId }, include: { supplier: true, items: { include: { product: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.product.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
  ])

  if (type === 'sales') {
    return res.json({ report: { type, title: 'Rapport de Ventes', generatedAt: new Date(), count: sales.length, total: sales.reduce((sum, sale) => sum + Number(sale.total), 0), rows: sales.map((sale) => ({ reference: sale.invoiceNumber, customer: sale.customer?.name || 'Client comptant', date: sale.createdAt, total: Number(sale.total) })) } })
  }
  if (type === 'purchases') {
    return res.json({ report: { type, title: "Rapport d'Achats", generatedAt: new Date(), count: purchases.length, total: purchases.reduce((sum, purchase) => sum + Number(purchase.total), 0), rows: purchases.map((purchase) => ({ reference: purchase.invoiceNumber, supplier: purchase.supplier?.name || 'Fournisseur non renseigné', date: purchase.createdAt, total: Number(purchase.total) })) } })
  }
  if (type === 'stock') {
    return res.json({ report: { type, title: 'Valeur du Stock', generatedAt: new Date(), count: products.length, totalQuantity: products.reduce((sum, product) => sum + product.stock, 0), totalValue: products.reduce((sum, product) => sum + Number(product.buyPrice) * product.stock, 0), lowStock: products.filter((product) => product.stock > 0 && product.stock <= product.minStock), outOfStock: products.filter((product) => product.stock === 0), rows: products } })
  }
  if (type === 'margins' || type === 'performance') {
    const byProduct = new Map<string, { product: string; quantity: number; revenue: number; cost: number }>()
    for (const sale of sales) for (const item of sale.items) {
      const current = byProduct.get(item.productId) || { product: item.product.name, quantity: 0, revenue: 0, cost: 0 }
      current.quantity += item.quantity
      current.revenue += Number(item.total)
      current.cost += Number(item.product.buyPrice) * item.quantity
      byProduct.set(item.productId, current)
    }
    const rows = Array.from(byProduct.values()).map((row) => ({ ...row, margin: row.revenue - row.cost, marginPercent: row.revenue ? ((row.revenue - row.cost) / row.revenue) * 100 : 0 })).sort((a, b) => b.revenue - a.revenue)
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)
    const cost = rows.reduce((sum, row) => sum + row.cost, 0)
    return res.json({ report: { type, title: type === 'margins' ? 'Marges Bénéficiaires' : 'Performance Produits', generatedAt: new Date(), revenue, cost, margin: revenue - cost, marginPercent: revenue ? ((revenue - cost) / revenue) * 100 : 0, rows } })
  }
  if (type === 'critical') {
    const rows = products.filter((product) => product.stock <= product.minStock).map((product) => ({ name: product.name, sku: product.sku, stock: product.stock, minStock: product.minStock, status: product.stock === 0 ? 'Rupture' : 'Stock faible' }))
    return res.json({ report: { type, title: 'Stock Critique', generatedAt: new Date(), count: rows.length, rows } })
  }
  return res.status(404).json({ message: 'Rapport introuvable.' })
})
