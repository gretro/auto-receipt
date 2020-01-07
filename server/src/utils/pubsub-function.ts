export interface PubSubMessage {
  /**
   * Message data encoded in a base64 string
   */
  data: string

  attributes: Record<string, string>
}

export interface PubSubContext {
  eventId: string
  timestamp: string
  eventType: string
  resource: string
}

export type PubSubHandler = (
  message: PubSubMessage,
  context?: PubSubContext,
  callback?: (err?: any, value?: any) => void
) => Promise<void> | void
