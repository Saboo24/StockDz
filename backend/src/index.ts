import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { authRouter } from './routes/auth'
import { companyRouter } from './routes/company'
import { productRouter } from './routes/products'
import { salesRouter } from './routes/sales'
import { purchasesRouter } from './routes/purchases'
import { dashboardRouter } from './routes/dashboard'
import { customersRouter } from './routes/customers'
import { suppliersRouter } from './routes/suppliers'
import { categoriesRouter } from './routes/categories'
import { stockRouter } from './routes/stock'
import { notificationsRouter } from './routes/notifications'
import { reportsRouter } from './routes/reports'
import { searchRouter } from './routes/search'
import { invoicesRouter } from './routes/invoices'
import { expensesRouter } from './routes/expenses'
import { adminRouter } from './routes/admin'

const app = express()

const allowedOrigins = Array.from(new Set([
  env.clientUrl,
  'https://stockdz-delta.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
])).filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'StockDz-backend' })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/company', companyRouter)
app.use('/api/products', productRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/customers', customersRouter)
app.use('/api/suppliers', suppliersRouter)
app.use('/api/stock', stockRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/sales', salesRouter)
app.use('/api/purchases', purchasesRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/invoices', invoicesRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/search', searchRouter)

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unexpected error'
  res.status(500).json({ message })
})

app.listen(env.port, () => {
  console.log(`StockDz backend running on http://localhost:${env.port}`)
})
