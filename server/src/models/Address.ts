import * as Joi from 'joi'

export interface Address {
  line1: string
  line2: string | null
  city: string
  state: string | null
  postalCode: string | null
  country: string
}

export const addressSchema = Joi.object<Address>({
  line1: Joi.string()
    .required()
    .max(50),
  line2: Joi.string()
    .required()
    .allow(null)
    .max(50),
  city: Joi.string()
    .required()
    .max(50),
  state: Joi.string()
    .required()
    .max(50)
    .allow(null),
  postalCode: Joi.string()
    .required()
    .max(20)
    .allow(null),
  country: Joi.string()
    .required()
    .max(50),
})
