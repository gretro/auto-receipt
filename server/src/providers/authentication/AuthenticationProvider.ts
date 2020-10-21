import { Request } from 'express'
import { AuthenticatedUser } from '../../models/AuthenticatedUser'

export interface AuthenticationProvider {
  authenticateRequest(request: Request): Promise<AuthenticatedUser | null>
}
