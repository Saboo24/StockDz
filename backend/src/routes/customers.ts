import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const customersRouter = Router()
customersRouter.use(requireAuth, requireCompanyScope)

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

customersRouter.get('/', async (req, res) => {
  const customers = await prisma.customer.findMany({
    where: { companyId: req.companyId! },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ customers })
})

customersRouter.get('/:id', async (req, res) => {
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
  })

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  return res.json({ customer })
})

customersRouter.post('/', async (req, res) => {
  const parse = customerSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid customer payload' })
  }

  const customer = await prisma.customer.create({
    data: {
      companyId: req.companyId!,
      name: parse.data.name,
      email: parse.data.email || null,
      phone: parse.data.phone || null,
      address: parse.data.address || null,
    },
  })

  return res.status(201).json({ customer })
})

customersRouter.put('/:id', async (req, res) => {
  const parse = customerSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid customer payload' })
  }

  const customer = await prisma.customer.update({
    where: { id: req.params.id, companyId: req.companyId! },
    data: {
      name: parse.data.name,
      email: parse.data.email || null,
      phone: parse.data.phone || null,
      address: parse.data.address || null,
    },
  }).catch(() => null)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  return res.json({ customer })
})

customersRouter.delete('/:id', async (req, res) => {
  const customer = await prisma.customer.delete({
    where: { id: req.params.id, companyId: req.companyId! },
  }).catch(() => null)

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' })
  }

  return res.json({ ok: true, customer })
})
