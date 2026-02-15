import { RequestHandler } from 'express'
import Joi from 'joi'
import { paypalReceiptConfigRepository } from '../../../datastore/paypal-receipt-config-repository'
import { EntityNotFoundError } from '../../../errors/EntityNotFoundError'
import { getValidatedParam } from '../../../utils/validation'

export const getPaypalReceiptConfigHandler: RequestHandler = async (
  req,
  res
) => {
  const id = getValidatedParam(Joi.string().required(), req.params.id)

  const maybeConfig =
    await paypalReceiptConfigRepository.findPaypalReceiptConfigByItemId(id)

  if (!maybeConfig) {
    throw new EntityNotFoundError('PaypalReceiptConfig', id)
  }

  res.status(200).send(maybeConfig)
}
