import * as Joi from 'joi'
import { Address, addressSchema } from './Address'

export interface Donor {
  firstName: string | null
  lastName: string
  email: string | null
  address: Address | null
}

export const donorSchema = Joi.object<Donor>({
  firstName: Joi.string()
    .required()
    .max(64)
    .allow(null),
  lastName: Joi.string()
    .required()
    .max(64),
  email: Joi.string()
    .required()
    .email()
    .allow(null),
  address: addressSchema.required().allow(null),
})
