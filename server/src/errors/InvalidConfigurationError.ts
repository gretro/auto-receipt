export class InvalidConfigurationError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`)
    Error.captureStackTrace(this, InvalidConfigurationError)
  }
}
