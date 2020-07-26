import * as Joi from '@hapi/joi'
import { RequestHandler, Request, Response } from 'express'
import {
  pipeMiddlewares,
  allowMethods,
  validateBody,
  withApiToken,
} from '../../utils/http'
import { paymentService } from '../../services/payment-service'
import { DonationType, donationTypeSchema } from '../../models/Donation'
import { Donor, donorSchema } from '../../models/Donor'
import { handleErrors } from '../../utils/http'
import { publishMessage } from '../../pubsub/service'
import { GeneratePdfCommand } from '../../models/commands/GeneratePdfCommand'

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
  reason: Joi.string().allow(null),
})

export const createCheque: RequestHandler<{}> = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
  allowMethods('POST'),
  validateBody(schema)
)(
  async (req: Request<{}>, res: Response): Promise<void> => {
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

    const generatePdfCommand: GeneratePdfCommand = {
      donationId: donation.id,
      queueEmailTransmission: body.emailReceipt,
    }
    await publishMessage(generatePdfCommand, 'pdf')

    res.status(201).send(donation)
  }
)
