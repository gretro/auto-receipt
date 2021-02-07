import axios from 'axios'
import * as jwt from 'jsonwebtoken'
import { AuthenticationProvider } from './AuthenticationProvider'

export interface JwtConfig {
  jwksUrl: string
  audience: string
  issuer: string
}

export function jwtAuthProviderFactory(
  config: JwtConfig
): AuthenticationProvider {
  return {
    authenticateRequest: (req) => {
      const authHeader = req.header('Authorization')
      if (!authHeader) {
        return Promise.resolve(null)
      }

      const [method, token] = (authHeader || '').split(' ', 2)

      if (method !== 'Bearer') {
        return Promise.resolve(null)
      }

      return new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getJwks(config.jwksUrl),
          {
            audience: config.audience,
            issuer: config.issuer,
            algorithms: ['RS256'],
          },
          (err, decoded) => {
            if (err) {
              reject(err)
            } else if (decoded) {
              const tokenContent: {
                sub: string
                email: string | null | undefined
              } = decoded as any

              resolve({
                id: tokenContent.sub || '',
                email: tokenContent.email || '',
                authProvider: 'jwt',
              })
            } else {
              reject(new Error('Could not decode JWT token'))
            }
          }
        )
      })
    },
  }
}

function getJwks(jwksUrl: string): jwt.GetPublicKeyOrSecret {
  return (header, callback) => {
    axios
      .get<Record<string, string>>(jwksUrl)
      .then((response) => {
        const jwks = response.data
        const publicKey = jwks[header.kid || '']
        callback(null, publicKey)
      })
      .catch((err) => callback(err))
  }
}
