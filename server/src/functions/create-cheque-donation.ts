import { Donor, donorSchema } from '../models'
import * as Joi from '@hapi/joi'
import { RequestHandler } from 'express'
import { pipeMiddlewares, allowMethods, validateBody } from '../utils/functions'

interface CreateChequeBody {
  donor: Donor
  emailReceipt: boolean
  currency: string
  amount: number
  receiptAmount: number
  paymentDate: string
}

const schema = Joi.object<CreateChequeBody>({
  donor: donorSchema.required(),
  emailReceipt: Joi.boolean()
    .strict()
    .required(),
  currency: Joi.string()
    .required()
    .max(3)
    .uppercase(),
  amount: Joi.number()
    .precision(2)
    .required(),
  receiptAmount: Joi.number()
    .precision(2)
    .required(),
  paymentDate: Joi.string()
    .isoDate()
    .required(),
})

export const createCheque: RequestHandler<{}> = pipeMiddlewares(
  allowMethods('POST'),
  validateBody(schema)
)((req, res): void => {
  res.status(200).send('Success!')
})
