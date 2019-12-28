import * as Joi from '@hapi/joi'
import { Address, addressSchema } from './Address'

export interface Donor {
  firstName: string
  lastName: string
  email?: string
  address: Address
}

export const donorSchema = Joi.object<Donor>({
  firstName: Joi.string()
    .required()
    .max(50),
  lastName: Joi.string()
    .required()
    .max(50),
  email: Joi.string()
    .optional()
    .email(),
  address: addressSchema.required(),
})
