import { Request, RequestHandler, Response } from 'express'
import * as Joi from 'joi'
import { DonationType, donationTypeSchema } from '../../models/Donation'
import { Donor, donorSchema } from '../../models/Donor'
import { paymentService } from '../../services/payment-service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withAuth,
} from '../../utils/http'

interface CreateChequeViewModel {
  donationType: DonationType
  donationId?: string
  donor: Donor
  emailReceipt: boolean
  currency: string
  amount: number
  receiptAmount: number
  paymentDate: string
  reason?: string
}

const schema = Joi.object<CreateChequeViewModel>({
  donationType: donationTypeSchema.required(),
  donationId: Joi.any().when('donationType', {
    is: 'one-time',
    then: Joi.any().forbidden(),
    otherwise: Joi.string().required(),
  }),
  donor: donorSchema.required(),
  emailReceipt: Joi.boolean().strict().required(),
  currency: Joi.string().required().max(3).uppercase(),
  amount: Joi.number().precision(2).required(),
  receiptAmount: Joi.number().precision(2).required(),
  paymentDate: Joi.string().isoDate().required(),
  reason: Joi.string().allow(null),
})

export const createCheque: RequestHandler<any> = pipeMiddlewares(
  handleErrors(),
  withAuth(),
  allowMethods('POST'),
  validateBody(schema)
)(
  async (req: Request<any>, res: Response): Promise<void> => {
    const body: CreateChequeViewModel = req.body

    const donation = await paymentService.createPayment({
      source: 'cheque',
      type: body.donationType,
      externalId: body.donationId,
      donor: body.donor,
      emailReceipt: body.emailReceipt,
      currency: body.currency,
      amount: body.amount,
      receiptAmount: body.receiptAmount,
      paymentDate: body.paymentDate,
      reason: body.reason || undefined,
    })

    res.status(201).send(donation)
  }
)
