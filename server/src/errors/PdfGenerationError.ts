export class PdfGenerationError extends Error {
  constructor(nestedError: unknown) {
    const message =
      typeof nestedError === 'string'
        ? nestedError
        : (nestedError as Error).message ||
          ((nestedError as any) || '').toString()

    super(`An error occurred while generating PDF: ${message}`)
    Error.captureStackTrace(this, PdfGenerationError)
  }
}
