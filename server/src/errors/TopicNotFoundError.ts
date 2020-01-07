export class TopicNotFoundError extends Error {
  constructor(public name: string) {
    super(`Could not find topic ${name} in the configuration`)
    Error.captureStackTrace(this, TopicNotFoundError)
  }
}
