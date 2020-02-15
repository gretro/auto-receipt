/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from '@google-cloud/firestore'

export function mapTimestampToDate<T>(entity: T): T {
  const newObj = Object.keys(entity).reduce((acc, key) => {
    const value = (entity as any)[key]
    const mappedValue = mapTimestampValue(value)

    acc[key] = mappedValue

    return acc
  }, {} as any)

  return newObj
}

function mapTimestampValue<T>(value: T): any {
  if (value == null) {
    return value
  } else if (value instanceof Timestamp) {
    return value.toDate()
  } else if (Array.isArray(value)) {
    return value.map(mapTimestampValue)
  } else if (typeof value === 'object') {
    return mapTimestampToDate(value)
  }

  return value
}
