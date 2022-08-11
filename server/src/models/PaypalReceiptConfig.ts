import Joi from 'joi'

export interface PaypalReceiptConfig {
  paypalItemId: string
  receiptAmountFactor: number
}

export const paypalReceiptConfigSchema = Joi.object<PaypalReceiptConfig>({
  paypalItemId: Joi.string().required(),
  receiptAmountFactor: Joi.number().min(0).max(1).required(),
})
