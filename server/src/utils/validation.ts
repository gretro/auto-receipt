import { Schema } from 'joi'
import { InvalidEntityError } from '../errors/InvalidEntityError'

export function getValidatedDataWithExtras<T>(
  schema: Schema<T>,
  data: unknown
): T {
  const validationResult = schema.validate(data, {
    abortEarly: false,
    allowUnknown: true,
    convert: false,
  })
  if (validationResult.error) {
    throw new InvalidEntityError('Validation failed', validationResult)
  }

  return validationResult.value
}

export function getValidatedData<T>(schema: Schema<T>, data: unknown): T {
  const validationResult = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    convert: false,
  })
  if (validationResult.error) {
    throw new InvalidEntityError('Validation failed', validationResult)
  }

  return validationResult.value
}

export function getValidatedParam<T>(schema: Schema<T>, data: unknown): T {
  const validationResult = schema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
  })
  if (validationResult.error) {
    throw new InvalidEntityError('Validation failed', validationResult)
  }

  return validationResult.value
}
