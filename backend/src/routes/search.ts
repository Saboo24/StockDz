import { Router } from 'express'
import { requireAuth, requireCompanyScope } from '../lib/auth'
import { prisma } from '../lib/prisma'

export const searchRouter = Router()
searchRouter.use(requireAuth, requireCompanyScope)

searchRouter.get('/', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!query) return res.json({ products: [], categories: [], customers: [], suppliers: [], sales: [], purchases: [], invoices: [], expenses: [], movements: [] })
  const q = query.slice(0, 100)
  const companyId = req.companyId!
  const [products, categories, customers, suppliers, sales, purchases, invoices, expenses, movements] = await Promise.all([
    prisma.product.findMany({ where: { companyId, OR: [{ name: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }] }, take: 8 }),
    prisma.category.findMany({ where: { companyId, OR: [{ name: { contains: q } }, { slug: { contains: q } }] }, take: 8 }),
    prisma.customer.findMany({ where: { companyId, OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }, take: 8 }),
    prisma.supplier.findMany({ where: { companyId, OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }, take: 8 }),
    prisma.sale.findMany({ where: { companyId, OR: [{ invoiceNumber: { contains: q } }, { customer: { name: { contains: q } } }] }, include: { customer: true }, take: 8 }),
    prisma.purchase.findMany({ where: { companyId, OR: [{ invoiceNumber: { contains: q } }, { supplier: { name: { contains: q } } }] }, include: { supplier: true }, take: 8 }),
    prisma.invoice.findMany({ where: { companyId, OR: [{ invoiceNumber: { contains: q } }, { sale: { customer: { name: { contains: q } } } }] }, include: { sale: { include: { customer: true } } }, take: 8 }),
    prisma.expense.findMany({ where: { companyId, OR: [{ title: { contains: q } }, { category: { contains: q } }, { note: { contains: q } }] }, take: 8 }),
    prisma.stockMovement.findMany({ where: { companyId, OR: [{ reference: { contains: q } }, { notes: { contains: q } }, { product: { name: { contains: q } } }] }, include: { product: true }, take: 8 }),
  ])
  return res.json({ products, categories, customers, suppliers, sales, purchases, invoices, expenses, movements })
})
