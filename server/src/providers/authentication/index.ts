import * as config from 'config'
import { AuthenticationProvider } from './AuthenticationProvider'
import { jwtAuthProviderFactory, JwtConfig } from './JwtAuthProvider'
import { noAuthProvider } from './NoAuthProvider'

interface AuthenticationProviderConfig {
  provider: 'no-auth' | 'jwt'
  unauthorizedStatusCode: number
  jwt: JwtConfig
}

export function getAuthConfig(): AuthenticationProviderConfig {
  return config.get<AuthenticationProviderConfig>('providers.authentication')
}

export function getAuthenticationProvider(): AuthenticationProvider {
  const authConfig = getAuthConfig()

  switch (authConfig.provider) {
    case 'no-auth':
      return noAuthProvider

    case 'jwt':
      return jwtAuthProviderFactory(authConfig.jwt)
  }
}
