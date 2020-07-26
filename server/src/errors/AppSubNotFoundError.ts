export class AppSubNotFoundError extends Error {
  constructor(public key: string) {
    super(`Could not find app subscription ${key}`)
    Error.captureStackTrace(this, AppSubNotFoundError)
  }
}
