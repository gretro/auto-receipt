import * as Joi from '@hapi/joi'
import { Donor, donorSchema } from './Donor'
import { Payment, paymentSchema } from './Payment'
import { DocumentMetadata, documentMetadataSchema } from './DocumentMetadata'
import { Correspondence, correspondenceSchema } from './Correspondence'

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
  documentIds: string[]
  documents: DocumentMetadata[]
  correspondences: Correspondence[]
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
  documentIds: Joi.array()
    .required()
    .min(0)
    .items(Joi.string()),
  documents: Joi.array()
    .required()
    .min(0)
    .items(documentMetadataSchema),
  correspondences: Joi.array()
    .required()
    .min(0)
    .items(correspondenceSchema),
})
