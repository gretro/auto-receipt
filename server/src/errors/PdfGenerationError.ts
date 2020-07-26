export class PdfGenerationError extends Error {
  constructor(public nestedError: any) {
    super(
      `An error occurred while generating PDF: ${nestedError?.message ||
        nestedError}`
    )
    Error.captureStackTrace(this, PdfGenerationError)
  }
}
