import crypto from 'crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env'
import { prisma } from '../lib/prisma'
import { hashPassword, requireAuth, signToken, verifyPassword, verifyToken } from '../lib/auth'
import { createSingleUseToken, sendApprovalDecisionEmail, sendApprovalRequestEmail, sendPasswordChangedEmail, sendPasswordResetEmail } from '../lib/email'

export const authRouter = Router()

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  language: z.enum(['en', 'fr']).optional(),
})
const resetCodeVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  language: z.enum(['en', 'fr']).optional(),
})
const resetPasswordSchema = z.union([
  z.object({
    token: z.string(),
    password: z.string().min(8),
    language: z.enum(['en', 'fr']).optional(),
  }),
  z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/),
    password: z.string().min(8),
    language: z.enum(['en', 'fr']).optional(),
  }),
])
const approvalDecisionSchema = z.object({
  token: z.string().min(10),
  action: z.enum(['approve', 'reject']),
})

function hashApprovalToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function hashResetCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateResetCode() {
  return crypto.randomInt(100000, 1000000).toString().padStart(6, '0')
}

function isValidResetHash(code: string, storedHash: string | null) {
  if (!storedHash) return false

  const hashed = Buffer.from(hashResetCode(code), 'hex')
  const expected = Buffer.from(storedHash, 'hex')

  if (hashed.length !== expected.length) return false
  return crypto.timingSafeEqual(hashed, expected)
}

async function resolveApprovalDecision(token: string, action: 'approve' | 'reject') {
  const hashed = hashApprovalToken(token)
  const user = await prisma.user.findFirst({
    where: {
      approvalTokenHash: hashed,
      status: 'PENDING',
      approvalTokenUsedAt: null,
      approvalTokenExpiresAt: {
        gt: new Date(),
      },
    },
    include: { company: true },
  })

  if (!user) {
    throw new Error('This approval link is invalid or has expired.')
  }

  const nextStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: nextStatus,
      isActive: action === 'approve',
      approvalTokenHash: null,
      approvalTokenExpiresAt: null,
      approvalTokenUsedAt: new Date(),
    },
  })

  return { user: updatedUser, company: user.company }
}

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parse.error.issues })
  }

  const { firstName, lastName, email, password, companyName, phone } = parse.data
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await prisma.user.findFirst({ where: { email: normalizedEmail } })
  if (existing) {
    return res.status(409).json({ message: 'User already exists' })
  }

  const existingCompany = await prisma.company.findUnique({ where: { email: normalizedEmail } })

  const passwordHash = await hashPassword(password)
  const approvalToken = crypto.randomBytes(32).toString('hex')

  const result = await prisma.$transaction(async (tx) => {
    const company = existingCompany
      ? await tx.company.update({
          where: { id: existingCompany.id },
          data: {
            name: companyName,
            phone: phone || existingCompany.phone || null,
            email: normalizedEmail,
            currency: 'DZD',
          },
        })
      : await tx.company.create({
          data: { name: companyName, email: normalizedEmail, phone: phone || null, currency: 'DZD' },
        })

    const user = await tx.user.create({
      data: {
        companyId: company.id,
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash,
        phone: phone || null,
        status: 'PENDING',
        isActive: false,
        approvalTokenHash: hashApprovalToken(approvalToken),
        approvalTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    })

    return { company, user }
  })

  const { company, user } = result
  const approvalUrl = `${env.backendUrl}/api/auth/approval?token=${encodeURIComponent(approvalToken)}&action=approve`
  const rejectUrl = `${env.backendUrl}/api/auth/approval?token=${encodeURIComponent(approvalToken)}&action=reject`

  console.log('[StockDZ APPROVAL TOKEN]', {
    email: normalizedEmail,
    companyName,
    approvalToken,
    approvalUrl,
    rejectUrl,
  })

  await sendApprovalRequestEmail({
    to: env.adminEmail,
    firstName,
    lastName,
    email: normalizedEmail,
    companyName,
    phone,
    approvalUrl,
    rejectUrl,
  })

  return res.status(201).json({
    message: 'Votre compte a été créé avec succès. Il est en attente d’approbation par l’administrateur StockDz.',
    user: {
      id: user.id,
      companyId: company.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      isActive: user.isActive,
    },
    company: { id: company.id, name: company.name },
  })
})

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  const { password } = parse.data
  const email = parse.data.email.trim().toLowerCase()
  const user = await prisma.user.findFirst({ where: { email } })

  if (!user) {
    return res.status(401).json({ message: 'Identifiants incorrects.' })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ message: 'Identifiants incorrects.' })
  }

  if (user.status === 'PENDING') {
    return res.status(403).json({ message: 'Votre compte est en attente d’approbation.' })
  }

  if (user.status === 'REJECTED') {
    return res.status(403).json({ message: 'Votre compte a été refusé par l’administrateur.' })
  }

  const token = signToken({ sub: user.id, companyId: user.companyId, email: user.email })
  return res.json({ token, user: { id: user.id, companyId: user.companyId, firstName: user.firstName, lastName: user.lastName, email: user.email, status: user.status, isActive: user.isActive } })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      companyId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      isActive: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (user.status === 'PENDING') {
    return res.status(403).json({ message: 'Votre compte est en attente d’approbation.' })
  }

  if (user.status === 'REJECTED') {
    return res.status(403).json({ message: 'Votre compte a été refusé par l’administrateur.' })
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { id: true, name: true, email: true, phone: true, address: true },
  })

  return res.json({ user, company })
})

authRouter.get('/approval', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : ''
  const action = typeof req.query.action === 'string' ? req.query.action : ''
  const parsed = approvalDecisionSchema.safeParse({ token, action })

  if (!parsed.success) {
    return res.status(400).send('Lien d’approbation invalide.')
  }

  try {
    const { user, company } = await resolveApprovalDecision(parsed.data.token, parsed.data.action)
    const decisionLabel = parsed.data.action === 'approve' ? 'approuvé' : 'refusé'
    const emailResult = await sendApprovalDecisionEmail({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: company.name,
      decision: parsed.data.action,
    })

    const resultUrl = new URL(`${env.frontendUrl}/approval-result`)
    resultUrl.searchParams.set('decision', parsed.data.action)
    resultUrl.searchParams.set('email', user.email)
    resultUrl.searchParams.set('emailSent', emailResult.delivered === false ? 'false' : 'true')
    return res.redirect(303, resultUrl.toString())
  } catch (error: any) {
    return res.status(400).send(error.message || 'Invalid approval link.')
  }
})

authRouter.post('/approval', async (req, res) => {
  const parsed = approvalDecisionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid approval payload' })
  }

  try {
    const { user, company } = await resolveApprovalDecision(parsed.data.token, parsed.data.action)
    await sendApprovalDecisionEmail({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: company.name,
      decision: parsed.data.action,
    })

    return res.json({ message: `Compte ${user.email} ${parsed.data.action === 'approve' ? 'approuvé' : 'refusé'} avec succès.` })
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Invalid approval link.' })
  }
})

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true })
})

authRouter.post('/forgot-password', async (req, res) => {
  const parse = forgotPasswordSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid email' })
  }

  const email = parse.data.email.trim().toLowerCase()
  const language = parse.data.language === 'fr' ? 'fr' : 'en'
  const user = await prisma.user.findFirst({ where: { email } })
  if (!user) {
    return res.json({ message: language === 'fr' ? 'Code envoyé par email.' : 'Code sent by email.' })
  }

  const code = generateResetCode()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCodeHash: hashResetCode(code),
      resetCodeExpiresAt: expiresAt,
      resetCodeUsedAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      resetPasswordTokenUsedAt: null,
    },
  })

  const emailResult = await sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    code,
    expiresInMinutes: 10,
    language,
  })

  if (!emailResult.delivered) {
    return res.status(500).json({ message: 'Unable to send the reset code right now.' })
  }

  return res.json({ message: 'Code envoyé par email.' })
})

authRouter.post('/verify-reset-code', async (req, res) => {
  const parse = resetCodeVerificationSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Code invalide.' })
  }

  const user = await prisma.user.findFirst({
    where: {
      email: parse.data.email.trim().toLowerCase(),
      resetCodeUsedAt: null,
      resetCodeHash: { not: null },
      resetCodeExpiresAt: { gt: new Date() },
    },
  })

  if (!user || !isValidResetHash(parse.data.code, user.resetCodeHash)) {
    return res.status(400).json({ message: parse.data.language === 'fr' ? 'Code invalide ou expiré.' : 'Invalid or expired code.' })
  }

  return res.json({ message: parse.data.language === 'fr' ? 'Code vérifié.' : 'Code verified.' })
})

authRouter.post('/reset-password', async (req, res) => {
  const parse = resetPasswordSchema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  try {
    const password = parse.data.password
    const language = parse.data.language === 'fr' ? 'fr' : 'en'

    let user
    if ('email' in parse.data && 'code' in parse.data) {
      const email = parse.data.email.trim().toLowerCase()
      const code = parse.data.code

      user = await prisma.user.findFirst({
        where: {
          email,
          resetCodeUsedAt: null,
          resetCodeHash: { not: null },
          resetCodeExpiresAt: { gt: new Date() },
        },
      })

      if (!user || !isValidResetHash(code, user.resetCodeHash)) {
        return res.status(400).json({ message: language === 'fr' ? 'Le code est invalide ou expiré.' : 'The code is invalid or expired.' })
      }
    } else if ('token' in parse.data) {
      const hashed = hashResetToken(parse.data.token)
      user = await prisma.user.findFirst({
        where: {
          resetPasswordTokenHash: hashed,
          resetPasswordTokenUsedAt: null,
          resetPasswordTokenExpiresAt: { gt: new Date() },
        },
      })

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' })
      }
    } else {
      return res.status(400).json({ message: 'Invalid payload' })
    }

    const passwordHash = await hashPassword(password)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordTokenExpiresAt: null,
        resetPasswordTokenUsedAt: new Date(),
        resetCodeHash: null,
        resetCodeExpiresAt: null,
        resetCodeUsedAt: new Date(),
      },
    })

    await sendPasswordChangedEmail({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      language,
    })

    return res.json({ message: language === 'fr' ? 'Mot de passe réinitialisé avec succès.' : 'Password reset successfully.' })
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Invalid token' })
  }
})
