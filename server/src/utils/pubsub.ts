import { PubSubMessage } from './pubsub-function'

export function writeMessageAsJson(message: unknown): Buffer {
  const json = JSON.stringify(message)
  const buffer = Buffer.from(json, 'utf8')

  return buffer
}

export function readJsonMessage<T>(message: PubSubMessage): T {
  const json = Buffer.from(message.data, 'base64').toString('utf8')
  const value: T = JSON.parse(json)

  return value
}
