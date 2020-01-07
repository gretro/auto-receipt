import { RequestHandler, Response, Request, NextFunction } from 'express'
import { Schema } from '@hapi/joi'
import * as config from 'config'
import { ApiConfig } from '../models/ApiConfig'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { InvalidEntityError } from '../errors/InvalidEntityError'
import { PayPalIpnVerificationError } from '../errors/PayPalIPNVerificationError'
import { logger } from './logging'

export type FunctionMiddleware = (
  requestHandler: RequestHandler<{}>
) => RequestHandler<{}>

/**
 * Validates the request is authorized.
 *
 * Note: Validating using an API Token is temporary. We should instead use OAuth / OIDC
 */
export const withApiToken = (): FunctionMiddleware => {
  const apiConfig = config.get<ApiConfig>('api')

  return (handler: RequestHandler<{}>): RequestHandler<{}> => {
    return (
      request: Request<{}>,
      response: Response,
      next: NextFunction
    ): unknown => {
      const reqToken = request.header('x-api-token')
      if (reqToken === apiConfig.apiToken) {
        return handler(request, response, next)
      }

      logger.warn('Request unauthorized. Rejecting it', {
        ip: request.ip,
        emptyAuth: !reqToken,
      })
      response.status(401).send('Unauthorized')
      return
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
  return (handler: RequestHandler<{}>): RequestHandler<{}> => {
    return (
      request: Request<{}>,
      response: Response,
      next: NextFunction
    ): unknown => {
      const methods = allowedMethods.map(method => method.toUpperCase())
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
  return (handler: RequestHandler<{}>): RequestHandler<{}> => {
    return (
      request: Request<{}>,
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
  return (handler: RequestHandler<{}>): RequestHandler<{}> => {
    return async (request, response, next): Promise<void> => {
      try {
        await handler(request, response, next)
      } catch (error) {
        if (error instanceof EntityNotFoundError) {
          sendError(response, 404, error, 'Not Found')
          return
        }
        if (error instanceof PayPalIpnVerificationError) {
          logger.error(error)
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
  return (handler: RequestHandler<{}>): RequestHandler<{}> => {
    return middlewares.reduceRight((acc, current) => {
      return current(acc)
    }, handler)
  }
}
