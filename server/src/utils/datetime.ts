export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE

export function addTime(inputDate: Date, timeInMs: number): Date {
  const ts = inputDate.getTime()

  if (Number.isNaN(ts)) {
    throw new Error('Date is invalid')
  }

  const adjustedTs = ts + timeInMs

  return new Date(adjustedTs)
}
