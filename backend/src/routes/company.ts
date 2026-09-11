import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const companyRouter = Router()

companyRouter.use(requireAuth, requireCompanyScope)

const settingSchema = z.object({ key: z.string().min(1), value: z.string().min(1) })

companyRouter.get('/', async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.companyId! },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })

  const settings = await prisma.setting.findMany({
    where: { companyId: req.companyId! },
    orderBy: { key: 'asc' },
  })

  return res.json({ company, settings })
})

companyRouter.get('/me', async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: req.companyId! },
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  })

  return res.json({ company })
})

companyRouter.get('/settings', async (req, res) => {
  const settings = await prisma.setting.findMany({
    where: { companyId: req.companyId! },
    orderBy: { key: 'asc' },
  })

  return res.json({ settings })
})

companyRouter.put('/settings', async (req, res) => {
  const parse = settingSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid setting payload' })
  }

  const setting = await prisma.setting.upsert({
    where: { companyId_key: { companyId: req.companyId!, key: parse.data.key } },
    update: { value: parse.data.value },
    create: { companyId: req.companyId!, key: parse.data.key, value: parse.data.value },
  })

  return res.json({ setting })
})

companyRouter.put('/', async (req, res) => {
  const company = await prisma.company.update({
    where: { id: req.companyId! },
    data: {
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
      email: typeof req.body?.email === 'string' ? req.body.email : undefined,
      phone: typeof req.body?.phone === 'string' ? req.body.phone : undefined,
      address: typeof req.body?.address === 'string' ? req.body.address : undefined,
    },
  })

  return res.json({ company })
})
