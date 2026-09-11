import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const productRouter = Router()

productRouter.use(requireAuth, requireCompanyScope)

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  buyPrice: z.coerce.number().nonnegative(),
  sellPrice: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative().default(0),
  minStock: z.coerce.number().int().nonnegative().default(0),
  unit: z.string().default('pièce'),
})

productRouter.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined
  const lowStock = req.query.lowStock === 'true'

  const where: any = { companyId: req.companyId! }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { barcode: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (lowStock) {
    where.OR = [
      ...(where.OR ?? []),
      { stock: { lte: 5 } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ products })
})

productRouter.post('/', async (req, res) => {
  const parse = productSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid product payload', issues: parse.error.issues })
  }

  try {
    const product = await prisma.product.create({
      data: {
        companyId: req.companyId!,
        ...parse.data,
      },
    })

    return res.status(201).json({ product })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'A product with this SKU already exists in your company.' })
    }

    throw error
  }
})

productRouter.get('/:id', async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: { category: true },
  })

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  return res.json({ product })
})

productRouter.put('/:id', async (req, res) => {
  const parse = productSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid product payload', issues: parse.error.issues })
  }

  const product = await prisma.product.update({
    where: { id: req.params.id, companyId: req.companyId! },
    data: {
      ...parse.data,
    },
  }).catch(() => null)

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  return res.json({ product })
})

productRouter.delete('/:id', async (req, res) => {
  const product = await prisma.product.delete({
    where: { id: req.params.id, companyId: req.companyId! },
  }).catch(() => null)

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  return res.json({ ok: true, product })
})
