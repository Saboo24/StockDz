import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'
import { syncStockNotification } from '../lib/stock-notifications'

export const purchasesRouter = Router()

purchasesRouter.use(requireAuth, requireCompanyScope)

const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
})

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  invoiceNumber: z.string().min(1),
  note: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1),
})

const normalizePurchaseItems = (items: Array<{ productId: string; quantity: number; unitPrice: number }>) =>
  items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    total: Number(item.quantity) * Number(item.unitPrice),
  }))

const ensureValidPurchasePayload = async (companyId: string, items: Array<{ productId: string; quantity: number; unitPrice: number }>, supplierId?: string) => {
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    throw new Error('Un produit ne peut apparaître qu’une seule fois.')
  }

  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId }, select: { id: true } })
    if (!supplier) {
      throw new Error('Fournisseur introuvable.')
    }
  }

  const uniqueProductIds = [...new Set(items.map((item) => item.productId))]
  const products = await prisma.product.findMany({ where: { id: { in: uniqueProductIds }, companyId } })

  if (products.length !== uniqueProductIds.length) {
    throw new Error('Produit introuvable.')
  }

  return new Map(products.map((product) => [product.id, product]))
}

const getPurchaseTotal = (items: Array<{ quantity: number; unitPrice: number }>) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

purchasesRouter.get('/:id', async (req, res) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { supplier: true, items: { include: { product: true } } },
  })

  if (!purchase) return res.status(404).json({ message: 'Achat introuvable.' })
  return res.json({ purchase })
})

purchasesRouter.get('/', async (req, res) => {
  const purchases = await prisma.purchase.findMany({
    where: { companyId: req.companyId! },
    include: { items: true, supplier: true },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ purchases })
})

purchasesRouter.post('/', async (req, res) => {
  const parse = purchaseSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid purchase payload', issues: parse.error.issues })
  }

  const companyId = req.companyId!
  const { supplierId, invoiceNumber, note, items } = parse.data
  const normalizedItems = normalizePurchaseItems(items)

  try {
    const productMap = await ensureValidPurchasePayload(companyId, normalizedItems, supplierId)
    const total = getPurchaseTotal(normalizedItems)

    const purchase = await prisma.$transaction(async (tx) => {
      const duplicatePurchase = await tx.purchase.findFirst({
        where: { companyId, invoiceNumber: invoiceNumber.trim() },
        select: { id: true },
      })

      if (duplicatePurchase) {
        throw new Error('Une facture avec cette référence existe déjà.')
      }

      const created = await tx.purchase.create({
        data: {
          companyId,
          supplierId,
          invoiceNumber: invoiceNumber.trim(),
          note: note?.trim() || null,
          total,
          status: 'received',
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

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw new Error('Produit introuvable.')
        }

        await tx.product.update({
          where: { id: product.id, companyId },
          data: { stock: { increment: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: product.id,
            type: 'IN',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reference: created.invoiceNumber,
            notes: `Purchase invoice ${created.invoiceNumber}`,
          },
        })
      }

      await tx.notification.create({
        data: {
          companyId,
          userId: req.user?.sub,
          type: 'purchase',
          title: 'Achat enregistré',
          message: `${created.invoiceNumber} - ${total.toLocaleString('fr-DZ')} DZA`,
          dedupeKey: `purchase:${created.id}`,
        },
      })

      return created
    })

    const currentProducts = await prisma.product.findMany({
      where: { companyId, id: { in: normalizedItems.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true, minStock: true },
    })
    await Promise.all(currentProducts.map((product) => syncStockNotification(companyId, product)))

    return res.status(201).json({ purchase })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create purchase'
    const status = message.includes('Fournisseur introuvable') || message.includes('Produit introuvable') || message.includes('référence existe') ? 422 : 400
    return res.status(status).json({ message })
  }
})

purchasesRouter.put('/:id', async (req, res) => {
  const parse = purchaseSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid purchase payload', issues: parse.error.issues })
  }

  const companyId = req.companyId!
  const purchaseId = req.params.id
  const { supplierId, invoiceNumber, note, items } = parse.data
  const normalizedItems = normalizePurchaseItems(items)

  try {
    const existingPurchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, companyId },
      include: { items: true },
    })

    if (!existingPurchase) {
      return res.status(404).json({ message: 'Achat introuvable.' })
    }

    const productMap = await ensureValidPurchasePayload(companyId, normalizedItems, supplierId)
    const oldQuantities = new Map(existingPurchase.items.map((item) => [item.productId, item.quantity]))

    for (const item of normalizedItems) {
      const product = productMap.get(item.productId)
      if (!product) throw new Error('Produit introuvable.')
      const currentStock = product.stock + (oldQuantities.get(item.productId) ?? 0)
      if (currentStock < item.quantity) {
        throw new Error('Stock insuffisant.')
      }
    }

    const total = getPurchaseTotal(normalizedItems)

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      const duplicatePurchase = await tx.purchase.findFirst({
        where: {
          companyId,
          invoiceNumber: invoiceNumber.trim(),
          id: { not: purchaseId },
        },
        select: { id: true },
      })

      if (duplicatePurchase) {
        throw new Error('Une facture avec cette référence existe déjà.')
      }

      for (const item of existingPurchase.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, companyId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })

        if (updated.count !== 1) {
          throw new Error('Stock insuffisant pour annuler l’achat précédent.')
        }

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reference: existingPurchase.invoiceNumber,
            notes: `Purchase reversal ${existingPurchase.invoiceNumber}`,
          },
        })
      }

      const updated = await tx.purchase.update({
        where: { id: purchaseId, companyId },
        data: {
          supplierId,
          invoiceNumber: invoiceNumber.trim(),
          note: note?.trim() || null,
          total,
          status: 'received',
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
        include: { items: { include: { product: true } }, supplier: true },
      })

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)
        if (!product) throw new Error('Produit introuvable.')

        await tx.product.update({
          where: { id: product.id, companyId },
          data: { stock: { increment: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: product.id,
            type: 'IN',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reference: invoiceNumber.trim(),
            notes: `Purchase invoice ${invoiceNumber.trim()}`,
          },
        })
      }

      await tx.notification.upsert({
        where: { companyId_dedupeKey: { companyId, dedupeKey: `purchase:${purchaseId}` } },
        update: {
          title: 'Achat mis à jour',
          message: `${invoiceNumber.trim()} - ${total.toLocaleString('fr-DZ')} DZA`,
          isRead: false,
        },
        create: {
          companyId,
          userId: req.user?.sub,
          type: 'purchase',
          title: 'Achat mis à jour',
          message: `${invoiceNumber.trim()} - ${total.toLocaleString('fr-DZ')} DZA`,
          dedupeKey: `purchase:${purchaseId}`,
        },
      })

      return updated
    })

    const currentProducts = await prisma.product.findMany({
      where: { companyId, id: { in: normalizedItems.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true, minStock: true },
    })
    await Promise.all(currentProducts.map((product) => syncStockNotification(companyId, product)))

    return res.json({ purchase: updatedPurchase })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update purchase'
    const status = message.includes('Stock insuffisant') || message.includes('Produit introuvable') || message.includes('Fournisseur introuvable') || message.includes('référence existe') ? 422 : 400
    return res.status(status).json({ message })
  }
})

purchasesRouter.delete('/:id', async (req, res) => {
  const companyId = req.companyId!
  const purchaseId = req.params.id

  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, companyId },
    include: { items: true },
  })

  if (!purchase) {
    return res.status(404).json({ message: 'Achat introuvable.' })
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of purchase.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, companyId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })

        if (updated.count !== 1) {
          throw new Error('Stock insuffisant pour supprimer l’achat.')
        }

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            unitCost: item.unitPrice,
            reference: purchase.invoiceNumber,
            notes: `Purchase reversal ${purchase.invoiceNumber}`,
          },
        })
      }

      await tx.notification.deleteMany({ where: { companyId, dedupeKey: `purchase:${purchaseId}` } })
      await tx.purchaseItem.deleteMany({ where: { purchaseId } })
      await tx.purchase.delete({ where: { id: purchaseId, companyId } })
    })

    const currentProducts = await prisma.product.findMany({
      where: { companyId, id: { in: purchase.items.map((item) => item.productId) } },
      select: { id: true, name: true, stock: true, minStock: true },
    })
    await Promise.all(currentProducts.map((product) => syncStockNotification(companyId, product)))

    return res.json({ deleted: true, id: purchaseId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete purchase'
    return res.status(500).json({ message })
  }
})
