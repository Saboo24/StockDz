import type { UserTokenPayload } from './index'

declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload
      companyId?: string
    }
  }
}

export {}
