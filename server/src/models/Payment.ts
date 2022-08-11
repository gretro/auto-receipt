import Joi from 'joi'
import {
  PaypalPaymentSource,
  paypalPaymentSourceSchema,
} from './PaypalPaymentSource'

export const PaymentSources = {
  cheque: 'cheque',
  paypal: 'paypal',
  directDeposit: 'directDeposit',
  stocks: 'stocks',
  unknown: 'unknown',
}

export type PaymentSource = keyof typeof PaymentSources

export interface Payment {
  amount: number
  currency: string
  receiptAmount: number
  date: Date
  source: PaymentSource
  sourceDetails: PaypalPaymentSource | null
}

export const paymentSchema = Joi.object<Payment>({
  amount: Joi.number().positive().required(),
  currency: Joi.string().required().length(3),
  receiptAmount: Joi.number().positive().allow(0).required(),
  date: Joi.date().required(),
  source: Joi.string()
    .valid(...Object.keys(PaymentSources))
    .required(),
  sourceDetails: Joi.any().when('source', {
    switch: [
      {
        is: 'paypal',
        then: paypalPaymentSourceSchema.required(),
      },
    ],
    otherwise: Joi.any().valid(null),
  }),
})
