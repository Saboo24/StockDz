import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'
import { syncStockNotification } from '../lib/stock-notifications'

export const stockRouter = Router()
stockRouter.use(requireAuth, requireCompanyScope)

const stockMutationSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
  quantity: z.coerce.number().refine((value) => Number.isFinite(value) && value !== 0, {
    message: 'Quantity must be a non-zero number',
  }),
  unitCost: z.coerce.number().nonnegative().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

const stockInitialSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

const getMovementDelta = (type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN', quantity: number) => {
  if (type === 'OUT') return -Math.abs(quantity)
  if (type === 'ADJUSTMENT') return quantity
  return Math.abs(quantity)
}

stockRouter.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const where: any = { companyId: req.companyId! }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { barcode: { contains: search } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: 'asc' },
  })

  return res.json({ products })
})

stockRouter.get('/movements', async (req, res) => {
  const movements = await prisma.stockMovement.findMany({
    where: { companyId: req.companyId! },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return res.json({ movements })
})

stockRouter.get('/:productId', async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.productId, companyId: req.companyId! },
    include: { category: true },
  })

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  return res.json({ product })
})

stockRouter.post('/initial', async (req, res) => {
  const parse = stockInitialSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid initial stock payload' })
  }

  const { productId, quantity, reference, notes } = parse.data

  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: req.companyId! },
  })

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  if (quantity < 0) {
    return res.status(400).json({ message: 'Initial stock cannot be negative' })
  }

  const result = await prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        companyId: req.companyId!,
        productId,
        type: 'ADJUSTMENT',
        quantity,
        reference: reference ?? 'INITIAL-STOCK',
        notes: notes ?? 'Initial stock',
      },
    })

    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: { stock: quantity },
    })

    return { movement, product: updatedProduct }
  })

  await syncStockNotification(req.companyId!, result.product)

  return res.status(201).json(result)
})

stockRouter.post('/movements', async (req, res) => {
  const parse = stockMutationSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid stock movement payload' })
  }

  const { productId, type, quantity, unitCost, reference, notes } = parse.data
  const adjustedQuantity = Number(quantity)

  if (!Number.isFinite(adjustedQuantity) || adjustedQuantity === 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero or a valid adjustment delta' })
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: req.companyId! },
  })

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const delta = getMovementDelta(type, adjustedQuantity)
  const nextStock = product.stock + delta

  if (nextStock < 0) {
    return res.status(400).json({ message: `Insufficient stock for ${product.name}` })
  }

  const result = await prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        companyId: req.companyId!,
        productId,
        type,
        quantity: Math.abs(adjustedQuantity),
        unitCost: unitCost ? Number(unitCost) : null,
        reference: reference ?? null,
        notes: notes ?? null,
      },
    })

    const updatedProduct = await tx.product.update({
      where: { id: product.id },
      data: { stock: nextStock },
    })

    return { movement, product: updatedProduct }
  })

  await syncStockNotification(req.companyId!, result.product)

  return res.status(201).json(result)
})
