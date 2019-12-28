import { RequestHandler, Response, Request, NextFunction } from 'express'
import { Schema } from '@hapi/joi'

export type FunctionMiddleware = (
  requestHandler: RequestHandler<{}>
) => RequestHandler<{}>

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
        console.warn(
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
        console.log('A validation error occurred', validationResult)
        response.status(400).send(validationResult.error)
        return
      }

      return handler(request, response, next)
    }
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
