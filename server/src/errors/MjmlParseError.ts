interface MJMLParseError {
  line: number
  message: string
  tagName: string
  formattedMessage: string
}

export class MjmlParseError extends Error {
  constructor(public parseErrors: MJMLParseError[]) {
    super('Errors occurred while parsing MJML')

    Error.captureStackTrace(this, MjmlParseError)
  }
}
