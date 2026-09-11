import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const categoriesRouter = Router()
categoriesRouter.use(requireAuth, requireCompanyScope)

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
})

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

categoriesRouter.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { companyId: req.companyId! },
    orderBy: { name: 'asc' },
  })
  res.json({ categories })
})

categoriesRouter.post('/', async (req, res) => {
  const parse = categorySchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid category payload' })
  }

  try {
    const category = await prisma.category.create({
      data: {
        companyId: req.companyId!,
        name: parse.data.name,
        slug: slugify(parse.data.name),
        color: parse.data.color ?? '#2563eb',
      },
    })

    return res.status(201).json({ category })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'A category with this name already exists in your company.' })
    }

    throw error
  }
})

categoriesRouter.put('/:id', async (req, res) => {
  const parse = categorySchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid category payload' })
  }

  const category = await prisma.category.update({
    where: { id: req.params.id, companyId: req.companyId! },
    data: {
      name: parse.data.name,
      slug: slugify(parse.data.name),
      color: parse.data.color ?? '#2563eb',
    },
  }).catch(() => null)

  if (!category) {
    return res.status(404).json({ message: 'Category not found' })
  }

  return res.json({ category })
})

categoriesRouter.delete('/:id', async (req, res) => {
  const category = await prisma.category.delete({
    where: { id: req.params.id, companyId: req.companyId! },
  }).catch(() => null)

  if (!category) {
    return res.status(404).json({ message: 'Category not found' })
  }

  return res.json({ ok: true, category })
})
