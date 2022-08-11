import {
  PaypalReceiptConfig,
  paypalReceiptConfigSchema,
} from '../models/PaypalReceiptConfig'
import { getPaypalReceiptConfigCollection } from './store'
import { Document } from './models'
import { InvalidEntityError } from '../errors/InvalidEntityError'

async function findPaypalReceiptConfigByItemId(
  itemId: string
): Promise<PaypalReceiptConfig | undefined> {
  const db = getPaypalReceiptConfigCollection()
  const query = db.where('value.paypalItemId', '==', itemId).limit(1)

  const results = await query.get()
  if (results.empty) {
    return undefined
  }

  const doc = results.docs[0].data() as Document<PaypalReceiptConfig>
  return doc.value
}

async function upsertPaypalReceiptConfigForItemId(
  paypalReceiptConfig: PaypalReceiptConfig
): Promise<PaypalReceiptConfig> {
  const validationResult = paypalReceiptConfigSchema.validate(
    paypalReceiptConfig
  )
  if (validationResult.error) {
    throw new InvalidEntityError('PaypalReceiptConfig', validationResult)
  }

  const db = getPaypalReceiptConfigCollection()
  const docRef = db.doc(paypalReceiptConfig.paypalItemId)

  const wrappedDocument: Document<PaypalReceiptConfig> = {
    version: 1,
    value: paypalReceiptConfig,
  }

  await docRef.set(wrappedDocument)

  return paypalReceiptConfig
}

async function deletePaypalReceiptConfigByItemId(
  itemId: string
): Promise<void> {
  const db = getPaypalReceiptConfigCollection()
  const docRef = db.doc(itemId)

  await docRef.delete({
    exists: true,
  })
}

export const paypalReceiptConfigRepository = {
  findPaypalReceiptConfigByItemId,
  upsertPaypalReceiptConfigForItemId,
  deletePaypalReceiptConfigByItemId,
}
