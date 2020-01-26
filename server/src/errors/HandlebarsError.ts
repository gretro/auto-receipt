export class HandlebarsError extends Error {
  constructor(public nestedError: any) {
    super(
      `An error occurred while generating Handlebars HTML: ${nestedError?.message ||
        nestedError}`
    )
    Error.captureStackTrace(this, HandlebarsError)
  }
}
