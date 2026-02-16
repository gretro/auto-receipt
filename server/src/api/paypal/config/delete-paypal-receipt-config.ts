import { RequestHandler } from 'express'
import Joi from 'joi'
import { paypalReceiptConfigRepository } from '../../../datastore/paypal-receipt-config-repository'
import { getValidatedParam } from '../../../utils/validation'

export const deletePaypalReceiptConfigHandler: RequestHandler = async (
  req,
  res
) => {
  const id = getValidatedParam(Joi.string().required(), req.params.id)

  await paypalReceiptConfigRepository.deletePaypalReceiptConfigByItemId(id)
  res.sendStatus(204)
}
