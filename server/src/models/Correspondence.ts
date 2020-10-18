import Joi from 'joi'

export const CorrespondenceTypes = {
  'no-mailing-addr': 'no-mailing-addr',
  'thank-you': 'thank-you',
}

export type CorrespondenceType = keyof typeof CorrespondenceTypes

export const CorrespondenceStatuses = {
  created: 'created',
  sent: 'sent',
}

export type CorrespondenceStatus = keyof typeof CorrespondenceStatuses

export interface Correspondence {
  id: string
  date: Date
  sentTo: string
  type: CorrespondenceType
  attachments: string[]
  status: CorrespondenceStatus
}

export const correspondenceSchema = Joi.object<Correspondence>({
  id: Joi.string().required(),
  date: Joi.date().required(),
  sentTo: Joi.string().email().required(),
  type: Joi.string()
    .valid(...Object.keys(CorrespondenceTypes))
    .required(),
  attachments: Joi.array().required().items(Joi.string()),
  status: Joi.string()
    .valid(...Object.keys(CorrespondenceStatuses))
    .required(),
})
