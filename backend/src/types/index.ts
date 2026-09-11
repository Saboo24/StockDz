export type UserTokenPayload = {
  sub: string
  companyId: string
  email: string
}

export type AuthenticatedRequest = {
  user?: UserTokenPayload
  companyId?: string
}
