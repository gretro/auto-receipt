/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from '@google-cloud/firestore'

export function mapTimestampToDate<T>(entity: T): T {
  const newObj = Object.keys(entity).reduce((acc, key) => {
    const value = (entity as any)[key]

    if (value == null) {
      acc[key] = value
    } else if (value instanceof Timestamp) {
      acc[key] = value.toDate()
    } else if (Array.isArray(value)) {
      acc[key] = value.map(mapTimestampToDate)
    } else if (typeof value === 'object') {
      acc[key] = mapTimestampToDate(value)
    } else {
      acc[key] = value
    }

    return acc
  }, {} as any)

  return newObj
}
