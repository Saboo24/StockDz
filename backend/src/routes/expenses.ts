import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireCompanyScope } from '../lib/auth'

export const expensesRouter = Router()
expensesRouter.use(requireAuth, requireCompanyScope)

const expenseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  expenseDate: z.coerce.date().optional(),
  note: z.string().optional(),
})

expensesRouter.get('/', async (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined
  const expenses = await prisma.expense.findMany({ where: { companyId: req.companyId!, category, expenseDate: { gte: from, lte: to } }, orderBy: { expenseDate: 'desc' } })
  return res.json({ expenses })
})

expensesRouter.get('/:id', async (req, res) => {
  const expense = await prisma.expense.findFirst({ where: { id: req.params.id, companyId: req.companyId! } })
  if (!expense) return res.status(404).json({ message: 'Cette dépense est introuvable.' })
  return res.json({ expense })
})

expensesRouter.post('/', async (req, res) => {
  const parse = expenseSchema.safeParse(req.body)
  if (!parse.success) return res.status(422).json({ message: 'Données de dépense invalides.' })
  const expense = await prisma.expense.create({ data: { ...parse.data, companyId: req.companyId!, userId: req.user?.sub } })
  return res.status(201).json({ expense })
})

expensesRouter.put('/:id', async (req, res) => {
  const parse = expenseSchema.safeParse(req.body)
  if (!parse.success) return res.status(422).json({ message: 'Données de dépense invalides.' })
  const existing = await prisma.expense.findFirst({ where: { id: req.params.id, companyId: req.companyId! } })
  if (!existing) return res.status(404).json({ message: 'Cette dépense est introuvable.' })
  const expense = await prisma.expense.update({ where: { id: existing.id }, data: parse.data })
  return res.json({ expense })
})

expensesRouter.delete('/:id', async (req, res) => {
  const deleted = await prisma.expense.deleteMany({ where: { id: req.params.id, companyId: req.companyId! } })
  if (!deleted.count) return res.status(404).json({ message: 'Cette dépense est introuvable.' })
  return res.json({ ok: true })
})