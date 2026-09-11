import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth, requireCompanyScope)

notificationsRouter.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { companyId: req.companyId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return res.json({ notifications })
})

notificationsRouter.get('/:id', async (req, res) => {
  const notification = await prisma.notification.findFirst({ where: { id: req.params.id, companyId: req.companyId! } })
  if (!notification) return res.status(404).json({ message: 'Cette notification est introuvable.' })
  return res.json({ notification })
})

notificationsRouter.put('/:id/read', async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: req.params.id, companyId: req.companyId! },
    data: { isRead: true },
  }).catch(() => null)

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' })
  }

  return res.json({ notification })
})

notificationsRouter.put('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { companyId: req.companyId!, isRead: false },
    data: { isRead: true },
  })

  return res.json({ ok: true })
})

notificationsRouter.delete('/:id', async (req, res) => {
  const deleted = await prisma.notification.deleteMany({ where: { id: req.params.id, companyId: req.companyId! } })
  if (!deleted.count) return res.status(404).json({ message: 'Cette notification est introuvable.' })
  return res.json({ ok: true })
})
