import config from 'config'
import cors from 'cors'
import { NextFunction, Request, Response } from 'express'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { InvalidEntityError } from '../errors/InvalidEntityError'
import { PayPalIpnVerificationError } from '../errors/PayPalIpnVerificationError'
import {
  getAuthConfig,
  getAuthenticationProvider,
} from '../providers/authentication'
import { logger } from '../utils/logging'

interface CorsConfig {
  enabled: boolean
  allowedOrigins: string[]
}

const corsConfig = config.get<CorsConfig>('cors')

export const corsMiddleware = cors({
  origin: (requestOrigin, callback) => {
    if (!corsConfig.enabled || !requestOrigin) {
      callback(null, false)
      return
    }

    if (corsConfig.allowedOrigins.includes(requestOrigin.toLowerCase())) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'), false)
  },
})

export const authMiddleware = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  const authConfig = getAuthConfig()
  const authProvider = getAuthenticationProvider()

  try {
    const user = await authProvider.authenticateRequest(request)

    if (user) {
      ;(request as any).user = user
      next()
    } else {
      logger.warn('No authentication provided. Unauthorized access.', {
        ip: request.ip,
      })
      response.sendStatus(authConfig.unauthorizedStatusCode)
    }
  } catch (err) {
    logger.warn('Token validation failed. Unauthorized access.', {
      ip: request.ip,
      error: err,
      bearer: request.header('authentication'),
    })
    response.sendStatus(authConfig.unauthorizedStatusCode)
  }
}
/**
 * Express error-handling middleware. Must be registered with 4 parameters
 * so Express recognizes it. Handles EntityNotFoundError, PayPalIpnVerificationError,
 * InvalidEntityError, and generic errors.
 */
export const errorHandlerMiddleware = (
  err: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void => {
  logger.error('An error occurred during request handling', err)
  if (err instanceof EntityNotFoundError) {
    response.status(404).json({ message: 'Not Found' })
    return
  }
  if (err instanceof PayPalIpnVerificationError) {
    response.sendStatus(400)
    return
  }
  if (err instanceof InvalidEntityError) {
    response.status(400).json({
      message: 'Validation failed',
      errors: err.validationResults.error?.details?.map((detail) => ({
        message: detail.message,
        path: detail.path,
      })),
    })
    return
  }

  response.sendStatus(500)
}
