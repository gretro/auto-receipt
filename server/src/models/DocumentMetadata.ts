import * as Joi from '@hapi/joi'

export interface DocumentMetadata {
  id: string
  name: string
  description: string | null
  created: Date
}

export const documentMetadataSchema = Joi.object<DocumentMetadata>({
  id: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  created: Joi.date().required(),
})
