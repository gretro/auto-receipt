export class EntityNotFoundError extends Error {
  constructor(public entityName: string, public id: string) {
    super(`Could not find entity ${entityName} with ID ${id}`)
    Error.captureStackTrace(this, EntityNotFoundError)
  }
}
