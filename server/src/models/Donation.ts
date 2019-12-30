import * as Joi from '@hapi/joi'
import { Donor, donorSchema } from './Donor'
import { Payment, paymentSchema } from './Payment'

export type DonationType = 'one-time' | 'recurrent'

export interface Donation {
  id: string
  externalId: string | null
  created: Date
  fiscalYear: number
  type: DonationType
  donor: Donor
  payments: Payment[]
  emailReceipt: boolean
}

export const donationTypeSchema = Joi.string().valid('one-time', 'recurrent')

export const donationSchema = Joi.object<Donation>({
  id: Joi.string().required(),
  externalId: Joi.string()
    .required()
    .allow(null),
  created: Joi.date().required(),
  fiscalYear: Joi.number().required(),
  type: donationTypeSchema.required(),
  donor: donorSchema.required(),
  payments: Joi.array()
    .items(paymentSchema)
    .min(1)
    .required(),
  emailReceipt: Joi.boolean().required(),
})
