import * as Joi from 'joi'

export type CorrespondenceSubject = 'receipt'

export interface Correspondence {
  date: Date
  email: string
  subject: CorrespondenceSubject
  attachments: string[]
}

const correspondenceSubjectSchema = Joi.string().valid('receipt')

export const correspondenceSchema = Joi.object<Correspondence>({
  date: Joi.date().required(),
  email: Joi.string()
    .email()
    .required(),
  subject: correspondenceSubjectSchema,
  attachments: Joi.array()
    .required()
    .min(0)
    .items(Joi.string().required()),
})
