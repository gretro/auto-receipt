import Joi from 'joi'

export interface PaypalPaymentSource {
  id: string | null
}

export const paypalPaymentSourceSchema = Joi.object<PaypalPaymentSource>({
  id: Joi.string().required().allow(null),
})
