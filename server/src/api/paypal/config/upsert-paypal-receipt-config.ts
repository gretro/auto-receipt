import { RequestHandler } from 'express'
import Joi from 'joi'
import { paypalReceiptConfigRepository } from '../../../datastore/paypal-receipt-config-repository'
import { getValidatedData } from '../../../utils/validation'

interface UpsertPaypalReceiptConfigViewModel {
  paypalItemId: string
  receiptAmountFactor: number
}

const requestSchema = Joi.object<UpsertPaypalReceiptConfigViewModel>({
  paypalItemId: Joi.string().required(),
  receiptAmountFactor: Joi.number().min(0).max(1).required(),
})

export const upsertPaypalReceiptConfigHandler: RequestHandler = async (
  req,
  res
) => {
  const viewModel = getValidatedData(requestSchema.required(), req.body)

  const result =
    await paypalReceiptConfigRepository.upsertPaypalReceiptConfigForItemId(
      viewModel
    )
  res.status(200).send(result)
}
