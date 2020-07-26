export class UnsupportedLocaleError extends Error {
  constructor(public locale: string) {
    super(`Locale ${locale} is not supported`)
    Error.captureStackTrace(this, UnsupportedLocaleError)
  }
}
