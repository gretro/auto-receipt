export class InvalidEntityStateError extends Error {
  constructor(
    public entityName: string,
    public entityId: string,
    public operationName: string,
    public details: string[] = []
  ) {
    super(
      `Entity '${entityName}' with ID '${entityId}' is not in a valid state to perform operation '${operationName}': ${details.join(
        ' | '
      )}`
    )
    Error.captureStackTrace(this, InvalidEntityStateError)
  }
}
