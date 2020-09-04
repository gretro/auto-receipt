import * as Joi from 'joi'
import {
  PaypalPaymentSource,
  paypalPaymentSourceSchema,
} from './PaypalPaymentSource'

export type PaymentSource = 'cheque' | 'paypal' | 'import'

export interface Payment {
  amount: number
  currency: string
  receiptAmount: number
  date: Date
  source: PaymentSource
  sourceDetails: PaypalPaymentSource | null
}

export const paymentSchema = Joi.object<Payment>({
  amount: Joi.number()
    .positive()
    .required(),
  currency: Joi.string()
    .required()
    .length(3),
  receiptAmount: Joi.number()
    .positive()
    .required(),
  date: Joi.date().required(),
  source: Joi.string()
    .valid('cheque', 'paypal', 'import')
    .required(),
  sourceDetails: Joi.any().when('source', {
    break: true,
    switch: [
      {
        is: 'cheque',
        then: Joi.any().valid(null),
      },
      {
        is: 'paypal',
        then: paypalPaymentSourceSchema.required(),
      },
      {
        is: 'import',
        then: Joi.any().valid(null),
      },
    ],
  }),
})
