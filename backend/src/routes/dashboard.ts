import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth, requireCompanyScope)

dashboardRouter.get('/', async (req, res) => {
  const companyId = req.companyId!

  const [products, sales, purchases, notifications, customers, suppliers] = await Promise.all([
    prisma.product.findMany({ where: { companyId }, select: { id: true, stock: true, sellPrice: true, buyPrice: true, name: true } }),
    prisma.sale.findMany({ where: { companyId }, select: { total: true } }),
    prisma.purchase.findMany({ where: { companyId }, select: { total: true } }),
    prisma.notification.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.customer.count({ where: { companyId } }),
    prisma.supplier.count({ where: { companyId } }),
  ])

  const totalStock = products.reduce((sum, item) => sum + item.stock, 0)
  const totalInventoryValue = products.reduce((sum, item) => sum + Number(item.sellPrice) * item.stock, 0)
  const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const purchasesTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.total), 0)
  const lowStock = products.filter((product) => product.stock <= 5)

  const metrics = {
    salesToday: salesTotal,
    purchasesToday: purchasesTotal,
    lowStockProducts: lowStock.length,
    totalRevenue: salesTotal,
    totalExpenses: purchasesTotal,
    netProfit: Math.max(salesTotal - purchasesTotal, 0),
    totalCustomers: customers,
    totalSuppliers: suppliers,
    inventoryValue: totalInventoryValue,
  }

  return res.json({
    metrics,
    summary: {
      totalProducts: products.length,
      totalStock,
      inventoryValue: totalInventoryValue,
      salesTotal,
      purchasesTotal,
      lowStockCount: lowStock.length,
    },
    notifications,
    products: products.slice(0, 10),
    lowStockProducts: lowStock.slice(0, 10),
    recentSales: sales.slice(0, 5),
  })
})
