import { Router } from 'express'
import PDFDocument from 'pdfkit'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const invoicesRouter = Router()
invoicesRouter.use(requireAuth, requireCompanyScope)

const invoiceInclude = {
  sale: {
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  },
} as const

invoicesRouter.get('/', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: req.companyId!,
      status,
      createdAt: { gte: from, lte: to },
    },
    include: invoiceInclude,
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ invoices })
})

invoicesRouter.get('/:id', async (req, res) => {
  const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.companyId! }, include: invoiceInclude })
  if (!invoice) return res.status(404).json({ message: 'Cette facture est introuvable.' })
  return res.json({ invoice })
})

invoicesRouter.get('/:id/pdf', async (req, res) => {
  const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.companyId! }, include: { ...invoiceInclude, company: true } })
  if (!invoice) return res.status(404).json({ message: 'Cette facture est introuvable.' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`)
  const document = new PDFDocument({ margin: 48 })
  document.pipe(res)
  document.fontSize(22).fillColor('#2563eb').text('StockDZ')
  document.fontSize(10).fillColor('#444').text(invoice.company.name)
  if (invoice.company.email) document.text(invoice.company.email)
  if (invoice.company.phone) document.text(invoice.company.phone)
  if (invoice.company.address) document.text(invoice.company.address)
  document.moveDown().fillColor('#111').fontSize(18).text('FACTURE', { align: 'right' })
  document.fontSize(11).text(invoice.invoiceNumber, { align: 'right' })
  document.text(new Date(invoice.createdAt).toLocaleDateString('fr-DZ'), { align: 'right' })
  document.moveDown().fontSize(12).text(`Client: ${invoice.sale.customer?.name || 'Client comptant'}`)
  document.moveDown().fontSize(10)
  document.text('Produit'.padEnd(34) + 'Qté'.padEnd(8) + 'Prix'.padEnd(16) + 'Total')
  document.moveTo(48, document.y).lineTo(548, document.y).stroke('#d1d5db')
  for (const item of invoice.sale.items) {
    document.moveDown(0.4)
    document.text(`${item.product.name.slice(0, 32).padEnd(34)}${String(item.quantity).padEnd(8)}${Number(item.unitPrice).toLocaleString('fr-DZ').padEnd(16)}${Number(item.total).toLocaleString('fr-DZ')} DZA`)
  }
  document.moveDown().fontSize(14).text(`Total: ${Number(invoice.sale.total).toLocaleString('fr-DZ')} DZA`, { align: 'right' })
  document.fontSize(10).text(`Statut: ${invoice.status}`, { align: 'right' })
  document.end()
})