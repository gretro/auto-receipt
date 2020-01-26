import * as Joi from '@hapi/joi'

export interface DocumentMetadata {
  name: string
  description: string | null
  created: Date
}

export const documentMetadataSchema = Joi.object<DocumentMetadata>({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  created: Joi.date().required(),
})
