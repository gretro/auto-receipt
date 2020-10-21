import { AuthenticationProvider } from './AuthenticationProvider'

export const noAuthProvider: AuthenticationProvider = {
  authenticateRequest: () =>
    Promise.resolve({
      id: 'anonymous',
      email: 'anonymous',
      authProvider: 'no-auth',
    }),
}
