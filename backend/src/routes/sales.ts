import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'
import { syncStockNotification } from '../lib/stock-notifications'

export const salesRouter = Router()

salesRouter.use(requireAuth, requireCompanyScope)

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
})

const saleSchema = z.object({
  customerId: z.string().optional(),
  invoiceNumber: z.string().min(1),
  note: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
})

const normalizeSaleItems = (items: Array<{ productId: string; quantity: number; unitPrice: number }>) =>
  items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    total: Number(item.quantity) * Number(item.unitPrice),
  }))

const ensureValidSalePayload = async (companyId: string, items: Array<{ productId: string; quantity: number; unitPrice: number }>, customerId?: string) => {
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    throw new Error('Un produit ne peut apparaître qu’une seule fois.')
  }

  if (customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId }, select: { id: true } })
    if (!customer) {
      throw new Error('Client introuvable.')
    }
  }

  const uniqueProductIds = [...new Set(items.map((item) => item.productId))]
  const products = await prisma.product.findMany({ where: { id: { in: uniqueProductIds }, companyId } })

  if (products.length !== uniqueProductIds.length) {
    throw new Error('Produit introuvable.')
  }

  const productMap = new Map(products.map((product) => [product.id, product]))
  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new Error('Produit introuvable.')
    }
  }

  return productMap
}

const getSaleTotal = (items: Array<{ quantity: number; unitPrice: number }>) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

salesRouter.get('/:id', async (req, res) => {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { customer: true, items: { include: { product: true } } },
  })

  if (!sale) return res.status(404).json({ message: 'Vente introuvable.' })
  return res.json({ sale })
})

salesRouter.get('/', async (req, res) => {
  const sales = await prisma.sale.findMany({
    where: { companyId: req.companyId! },
    include: { items: { include: { product: true } }, customer: true },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ sales })
})

salesRouter.post('/', async (req, res) => {
  const parse = saleSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid sale payload', issues: parse.error.issues })
  }

  const companyId = req.companyId!
  const { customerId, invoiceNumber, note, items } = parse.data
  const normalizedItems = normalizeSaleItems(items)

  try {
    const productMap = await ensureValidSalePayload(companyId, normalizedItems, customerId)
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (!product) throw new Error('Produit introuvable.')
      if (product.stock < item.quantity) {
        throw new Error('Stock insuffisant.')
      }
    }

    const total = getSaleTotal(normalizedItems)

    const sale = await prisma.$transaction(async (tx) => {
      const duplicateSale = await tx.sale.findFirst({
        where: { companyId, invoiceNumber: invoiceNumber.trim() },
        select: { id: true },
      })

      if (duplicateSale) {
        throw new Error('Une facture avec cette référence existe déjà.')
      }

      const created = await tx.sale.create({
        data: {
          companyId,
          customerId,
          invoiceNumber: invoiceNumber.trim(),
          note: note?.trim() || null,
          total,
          status: 'paid',
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: { items: true },
      })

      await tx.invoice.create({
        data: {
          companyId,
          saleId: created.id,
          invoiceNumber: invoiceNumber.trim(),
          status: 'issued',
        },
      })

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)
        if (!product) throw new Error('Produit introuvable.')

        const updated = await tx.product.updateMany({
          where: { id: product.id, companyId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })

        if (updated.count !== 1) {
          throw new Error('Stock insuffisant.')
        }

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: product.id,
            type: 'OUT',
            quantity: item.quantity,
            unitCost: Number(product.buyPrice),
            reference: invoiceNumber.trim(),
            notes: `Sale invoice ${invoiceNumber.trim()}`,
          },
        })
      }

      await tx.notification.create({
        data: {
          companyId,
          userId: req.user?.sub,
          type: 'sale',
          title: 'Vente enregistrée',
          message: `${invoiceNumber.trim()} - ${total.toLocaleString('fr-DZ')} DZA`,
          dedupeKey: `sale:${created.id}`,
        },
      })

      return { ...created, invoiceNumber: invoiceNumber.trim() }
    })

    const currentProducts = await prisma.product.findMany({
      where: { companyId, id: { in: normalizedItems.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true, minStock: true },
    })
    await Promise.all(currentProducts.map((product) => syncStockNotification(companyId, product)))

    return res.status(201).json({ sale })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create sale'
    const status = message.includes('Stock insuffisant') || message.includes('Produit introuvable') || message.includes('Client introuvable') || message.includes('référence existe') ? 422 : 400
    return res.status(status).json({ message })
  }
})

salesRouter.put('/:id', async (req, res) => {
  const parse = saleSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid sale payload', issues: parse.error.issues })
  }

  const companyId = req.companyId!
  const saleId = req.params.id
  const { customerId, invoiceNumber, note, items } = parse.data
  const normalizedItems = normalizeSaleItems(items)

  try {
    const existingSale = await prisma.sale.findFirst({
      where: { id: saleId, companyId },
      include: { items: true },
    })

    if (!existingSale) {
      return res.status(404).json({ message: 'Vente introuvable.' })
    }

    const productMap = await ensureValidSalePayload(companyId, normalizedItems, customerId)
    const oldQuantities = new Map(existingSale.items.map((item) => [item.productId, item.quantity]))

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (!product) throw new Error('Produit introuvable.')
      const currentStock = product.stock + (oldQuantities.get(item.productId) ?? 0)
      if (currentStock < item.quantity) {
        throw new Error('Stock insuffisant.')
      }
    }

    const total = getSaleTotal(normalizedItems)

    const updatedSale = await prisma.$transaction(async (tx) => {
      const duplicateSale = await tx.sale.findFirst({
        where: {
          companyId,
          invoiceNumber: invoiceNumber.trim(),
          id: { not: saleId },
        },
        select: { id: true },
      })

      if (duplicateSale) {
        throw new Error('Une facture avec cette référence existe déjà.')
      }

      for (const item of existingSale.items) {
        await tx.product.update({
          where: { id: item.productId, companyId },
          data: { stock: { increment: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reference: existingSale.invoiceNumber,
            notes: `Sale reversal ${existingSale.invoiceNumber}`,
          },
        })
      }

      const updated = await tx.sale.update({
        where: { id: saleId, companyId },
        data: {
          customerId,
          invoiceNumber: invoiceNumber.trim(),
          note: note?.trim() || null,
          total,
          status: 'paid',
          items: {
            deleteMany: {},
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: { items: { include: { product: true } }, customer: true },
      })

      await tx.invoice.upsert({
        where: { saleId },
        update: { invoiceNumber: invoiceNumber.trim(), status: 'issued' },
        create: { companyId, saleId, invoiceNumber: invoiceNumber.trim(), status: 'issued' },
      })

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)
        if (!product) throw new Error('Produit introuvable.')

        const updatedProduct = await tx.product.updateMany({
          where: { id: product.id, companyId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })

        if (updatedProduct.count !== 1) {
          throw new Error('Stock insuffisant.')
        }

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: product.id,
            type: 'OUT',
            quantity: item.quantity,
            unitCost: Number(product.buyPrice),
            reference: invoiceNumber.trim(),
            notes: `Sale invoice ${invoiceNumber.trim()}`,
          },
        })
      }

      await tx.notification.upsert({
        where: { companyId_dedupeKey: { companyId, dedupeKey: `sale:${saleId}` } },
        update: {
          title: 'Vente mise à jour',
          message: `${invoiceNumber.trim()} - ${total.toLocaleString('fr-DZ')} DZA`,
          isRead: false,
        },
        create: {
          companyId,
          userId: req.user?.sub,
          type: 'sale',
          title: 'Vente mise à jour',
          message: `${invoiceNumber.trim()} - ${total.toLocaleString('fr-DZ')} DZA`,
          dedupeKey: `sale:${saleId}`,
        },
      })

      return updated
    })

    const currentProducts = await prisma.product.findMany({
      where: { companyId, id: { in: normalizedItems.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true, minStock: true },
    })
    await Promise.all(currentProducts.map((product) => syncStockNotification(companyId, product)))

    return res.json({ sale: updatedSale })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update sale'
    const status = message.includes('Stock insuffisant') || message.includes('Produit introuvable') || message.includes('Client introuvable') || message.includes('reférence existe') ? 422 : 400
    return res.status(status).json({ message })
  }
})

salesRouter.delete('/:id', async (req, res) => {
  const companyId = req.companyId!
  const saleId = req.params.id

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    include: { items: true },
  })

  if (!sale) return res.status(404).json({ message: 'Vente introuvable.' })

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId, companyId },
          data: { stock: { increment: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reference: sale.invoiceNumber,
            notes: `Sale reversal ${sale.invoiceNumber}`,
          },
        })
      }

      await tx.payment.deleteMany({ where: { saleId } })
      await tx.invoice.deleteMany({ where: { saleId } })
      await tx.saleItem.deleteMany({ where: { saleId } })
      await tx.sale.delete({ where: { id: saleId, companyId } })
    })

    const currentProducts = await prisma.product.findMany({
      where: { companyId, id: { in: sale.items.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true, minStock: true },
    })
    await Promise.all(currentProducts.map((product) => syncStockNotification(companyId, product)))

    return res.json({ deleted: true, id: saleId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete sale'
    return res.status(500).json({ message })
  }
})
