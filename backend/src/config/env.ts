import dotenv from 'dotenv'
import os from 'os'

dotenv.config()

function getLocalNetworkAddress() {
  const interfaces = os.networkInterfaces()
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) return address.address
    }
  }

  throw new Error('BACKEND_URL must be configured when no LAN address is available.')
}

const localBackendUrl = `http://${getLocalNetworkAddress()}:4000`

export const env = {
  port: Number(process.env.PORT || 4000),
  backendUrl: process.env.BACKEND_URL || localBackendUrl,
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/StockDz',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL || 'stockdz.support@gmail.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || 'stockdz.support@gmail.com',
    password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'your-app-password',
    from: process.env.SMTP_FROM || 'StockDZ <stockdz.support@gmail.com>',
  },
}
