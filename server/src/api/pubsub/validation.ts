import Joi from 'joi'
import {
  getValidatedData,
  getValidatedDataWithExtras,
} from '../../utils/validation'

interface PubSubPushPayload {
  message: {
    data: string
    attributes: Record<string, string>
    messageId: string
  }
  subscription: string
}

interface PubSubMessage<T> {
  data: T
  attributes: Record<string, string>
  messageId: string
}

const pubsubPushSchema = Joi.object<PubSubPushPayload>({
  message: Joi.object({
    data: Joi.string().base64().required(),
    attributes: Joi.object().pattern(Joi.string(), Joi.string()).default({}),
    messageId: Joi.string().required(),
  }).required(),
  subscription: Joi.string().required(),
})

export function extractPubSubMessage<T>(
  dataSchema: Joi.Schema<T>,
  body: unknown
): PubSubMessage<T> {
  const payload = getValidatedDataWithExtras(pubsubPushSchema.required(), body)

  const json = Buffer.from(payload.message.data, 'base64').toString('utf8')
  const dataValue: T = JSON.parse(json)

  const validatedData = getValidatedData(dataSchema, dataValue)

  return {
    attributes: payload.message.attributes,
    messageId: payload.message.messageId,
    data: validatedData,
  }
}
