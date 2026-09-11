import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const suppliersRouter = Router()
suppliersRouter.use(requireAuth, requireCompanyScope)

const supplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

suppliersRouter.get('/', async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: req.companyId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ suppliers })
})

suppliersRouter.get('/:id', async (req, res) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
  })

  if (!supplier) {
    return res.status(404).json({ message: 'Supplier not found' })
  }

  return res.json({ supplier })
})

suppliersRouter.post('/', async (req, res) => {
  const parse = supplierSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid supplier payload' })
  }

  const supplier = await prisma.supplier.create({
    data: {
      companyId: req.companyId!,
      name: parse.data.name,
      email: parse.data.email || null,
      phone: parse.data.phone || null,
      address: parse.data.address || null,
    },
  })

  return res.status(201).json({ supplier })
})

suppliersRouter.put('/:id', async (req, res) => {
  const parse = supplierSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid supplier payload' })
  }

  const supplier = await prisma.supplier.update({
    where: { id: req.params.id, companyId: req.companyId! },
    data: {
      name: parse.data.name,
      email: parse.data.email || null,
      phone: parse.data.phone || null,
      address: parse.data.address || null,
    },
  }).catch(() => null)

  if (!supplier) {
    return res.status(404).json({ message: 'Supplier not found' })
  }

  return res.json({ supplier })
})

suppliersRouter.delete('/:id', async (req, res) => {
  const supplier = await prisma.supplier.delete({
    where: { id: req.params.id, companyId: req.companyId! },
  }).catch(() => null)

  if (!supplier) {
    return res.status(404).json({ message: 'Supplier not found' })
  }

  return res.json({ ok: true, supplier })
})
