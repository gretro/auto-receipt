import config from 'config'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Schema } from 'joi'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { InvalidEntityError } from '../errors/InvalidEntityError'
import { PayPalIpnVerificationError } from '../errors/PayPalIpnVerificationError'
import { ApiConfig } from '../models/ApiConfig'
import {
  getAuthConfig,
  getAuthenticationProvider,
} from '../providers/authentication'
import { logger } from './logging'

interface CorsConfig {
  enabled: boolean
  allowedOrigins: string[]
}

export type FunctionMiddleware = (
  requestHandler: RequestHandler
) => RequestHandler

/**
 * Authenticates the request using the configured AuthenticationProvider
 */
export const withAuth = (): FunctionMiddleware => {
  return (handler: RequestHandler): RequestHandler => {
    return async (request, response, next): Promise<unknown> => {
      const authConfig = getAuthConfig()
      const authProvider = getAuthenticationProvider()

      try {
        const user = await authProvider.authenticateRequest(request)

        if (user) {
          ;(request as any).user = user
          return handler(request, response, next)
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

      return
    }
  }
}

export const withCORS = (): FunctionMiddleware => {
  return (handler: RequestHandler): RequestHandler => {
    return (
      request: Request,
      response: Response,
      next: NextFunction
    ): unknown => {
      const corsConfig = config.get<CorsConfig>('cors')
      const origin = request.header('Origin')
      if (
        !corsConfig.enabled ||
        !origin ||
        !corsConfig.allowedOrigins.includes(origin.toLowerCase())
      ) {
        response.sendStatus(200)
        return
      }

      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization,Content-Type'
      )
      response.setHeader(
        'Access-Control-Allow-Methods',
        request.header('Access-Control-Request-Method') || ''
      )

      if (request.method.toUpperCase() !== 'OPTIONS') {
        return handler(request, response, next)
      } else {
        response.sendStatus(200)
        return
      }
    }
  }
}

/**
 * Higher order function accepting only allowed methods
 * @param allowedMethods Allowed Verbs for the request. Can be 'GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', etc.
 * @param handler Request handler once the validation has occured
 */
export const allowMethods = (
  ...allowedMethods: string[]
): FunctionMiddleware => {
  return (handler: RequestHandler): RequestHandler => {
    return (
      request: Request,
      response: Response,
      next: NextFunction
    ): unknown => {
      const methods = allowedMethods.map((method) => method.toUpperCase())
      if (!methods.includes(request.method.toUpperCase())) {
        logger.warn(
          `Received request using verb ${request.method}, but this is not accepted for the current function`
        )

        response.status(405).send('Method Not Allowed')
        return
      }

      return handler(request, response, next)
    }
  }
}

/**
 * Applies validation to the HTTP body using HAPI Joi. A body must be present for this validation to succeed.
 * @param schema Schema to use for validation
 */
export const validateBody = (schema: Schema): FunctionMiddleware => {
  return (handler: RequestHandler): RequestHandler => {
    return (
      request: Request,
      response: Response,
      next: NextFunction
    ): unknown => {
      const validationResult = schema.required().validate(request.body, {
        abortEarly: false,
        convert: false,
        allowUnknown: false,
      })

      if (validationResult.error) {
        logger.info('A validation error occurred', validationResult)
        response.status(400).send(validationResult.error)
        return
      }

      return handler(request, response, next)
    }
  }
}

export const handleErrors = (): FunctionMiddleware => {
  return (handler: RequestHandler): RequestHandler => {
    return async (request, response, next): Promise<void> => {
      try {
        await handler(request, response, next)
      } catch (error) {
        if (error instanceof EntityNotFoundError) {
          sendError(response, 404, error, 'Not Found')
          return
        }
        if (error instanceof PayPalIpnVerificationError) {
          logger.error(PayPalIpnVerificationError.name, error)
          sendError(response, 400, '', '')
          return
        }
        if (error instanceof InvalidEntityError) {
          sendError(
            response,
            500,
            {
              message: error.message,
              stack: error.stack,
              validationResults: error.validationResults,
            },
            'Internal Server Error'
          )
          logger.error(`Could not handle invalid entity`, error)
          return
        }

        sendError(response, 500, error, 'Internal Server Error')
        logger.error('An unkown server error occurred', error)
      }
    }
  }
}

function sendError(
  response: Response,
  statusCode: number,
  descriptive: unknown,
  restricted: unknown
): void {
  const apiConfig = config.get<ApiConfig>('api')
  response.status(statusCode)

  if (apiConfig.showError) {
    let msg = descriptive
    if (descriptive instanceof Error) {
      msg = {
        message: descriptive.message,
        stack: descriptive.stack,
      }
    }

    response.send(msg)
  } else {
    response.send(restricted)
  }
}

/**
 * Pipes multiple middlewares together. The execution order is from left to right.
 * @param middlewares Middlewares to pipe together.
 */
export const pipeMiddlewares = (
  ...middlewares: FunctionMiddleware[]
): FunctionMiddleware => {
  return (handler: RequestHandler): RequestHandler => {
    return middlewares.reduceRight((acc, current) => {
      return current(acc)
    }, handler)
  }
}
