import * as Joi from 'joi'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PaypalPaymentSource {
  id: string | null
}

export const paypalPaymentSourceSchema = Joi.object<PaypalPaymentSource>({
  id: Joi.string()
    .required()
    .allow(null),
})
