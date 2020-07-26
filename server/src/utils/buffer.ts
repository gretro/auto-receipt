import { StringDecoder } from 'string_decoder'

export function bufferToString(buffer: Buffer): string {
  const decoder = new StringDecoder('utf8')
  const stringValue = decoder.end(buffer)
  return stringValue
}

export function jsonBufferToObject<T>(buffer: Buffer): T {
  const json = bufferToString(buffer)
  const obj = JSON.parse(json)

  return obj
}
