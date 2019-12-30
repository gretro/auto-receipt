import * as Joi from '@hapi/joi'

export class InvalidEntityError extends Error {
  constructor(
    public entityName: string,
    public validationResults: Joi.ValidationResult
  ) {
    super(`Entity '${entityName}' has failed validation`)
    Error.captureStackTrace(this, InvalidEntityError)
  }
}
