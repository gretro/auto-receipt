export class MjmlError extends Error {
  constructor(nestedError: unknown) {
    const message =
      typeof nestedError === 'string'
        ? nestedError
        : (nestedError as Error).message ||
          ((nestedError as any) || '').toString()

    super(`An error occurred while generating Handlebars HTML: ${message}`)
    Error.captureStackTrace(this, MjmlError)
  }
}
