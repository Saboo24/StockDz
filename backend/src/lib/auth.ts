import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env'
import { prisma } from './prisma'
import type { UserTokenPayload } from '../types'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function signToken(payload: UserTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as UserTokenPayload
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const decoded = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, status: true, isActive: true },
    })

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ message: 'Votre compte est en attente d’approbation.' })
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({ message: 'Votre compte a été refusé par l’administrateur.' })
    }

    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export async function requireCompanyScope(req: Request, res: Response, next: NextFunction) {
  const user = req.user
  if (!user?.companyId) {
    return res.status(401).json({ message: 'Missing company context' })
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true },
    })

    if (!company) {
      return res.status(403).json({ message: 'Company not found' })
    }

    req.companyId = user.companyId
    next()
  } catch {
    return res.status(500).json({ message: 'Company scope validation failed' })
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, status: true, isActive: true },
    })

    if (!adminUser || adminUser.status !== 'APPROVED' || !adminUser.isActive) {
      return res.status(403).json({ message: 'Admin access required' })
    }

    const adminEmails = new Set([
      (process.env.ADMIN_EMAIL || 'stockdz.support@gmail.com').toLowerCase(),
      'admin@stockdz.dz',
      'stockdz.support@gmail.com',
    ])

    if (!adminEmails.has(adminUser.email.toLowerCase())) {
      return res.status(403).json({ message: 'Admin access required' })
    }

    next()
  } catch {
    return res.status(500).json({ message: 'Admin authorization failed' })
  }
}
