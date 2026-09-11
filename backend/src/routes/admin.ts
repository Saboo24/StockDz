import { Router } from 'express'
import { z } from 'zod'
import { requireAdmin, requireAuth } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { sendApprovalDecisionEmail } from '../lib/email'
import { env } from '../config/env'

export const adminRouter = Router()

const decisionSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

adminRouter.use(requireAuth, requireAdmin)

adminRouter.get('/pending-users', async (_req, res) => {
  const pendingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' },
    include: { company: true },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({
    users: pendingUsers.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.company.name,
      status: user.status,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })),
  })
})

adminRouter.post('/users/:id/decision', async (req, res) => {
  const parse = decisionSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid approval payload' })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { company: true },
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (user.status !== 'PENDING') {
    return res.status(409).json({ message: 'Only pending users can be approved or rejected.' })
  }

  const nextStatus = parse.data.action === 'approve' ? 'APPROVED' : 'REJECTED'

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: nextStatus,
      isActive: parse.data.action === 'approve',
      approvalTokenHash: null,
      approvalTokenExpiresAt: null,
      approvalTokenUsedAt: new Date(),
    },
  })

  await sendApprovalDecisionEmail({
    to: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyName: user.company.name,
    decision: parse.data.action,
    loginUrl: `${env.frontendUrl}/login`,
  })

  return res.json({
    ok: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      status: updatedUser.status,
      isActive: updatedUser.isActive,
    },
    message: `Compte ${updatedUser.email} ${parse.data.action === 'approve' ? 'approuvé' : 'refusé'} avec succès.`,
  })
})
