export class HttpRequestError extends Error {
  constructor(message: string, private httpResponse: Response) {
    super(message);
    Error.captureStackTrace(this, HttpRequestError);
  }
}
