import { RequestHandler } from 'express'
import Joi from 'joi'
import { SendEmailCommand } from '../../models/commands/SendEmailCommand'
import {
  CorrespondenceType,
  CorrespondenceTypes,
} from '../../models/Correspondence'
import { publishMessage } from '../../pubsub/service'
import { getValidatedData } from '../../utils/validation'

interface BulkSendCorrespondenceViewModel {
  toSend: SendCorrespondenceViewModel[]
}

interface SendCorrespondenceViewModel {
  donationId: string
  correspondenceType: CorrespondenceType
}

const requestSchema = Joi.object<BulkSendCorrespondenceViewModel>({
  toSend: Joi.array()
    .min(1)
    .items(
      Joi.object<SendCorrespondenceViewModel>({
        donationId: Joi.string().required(),
        correspondenceType: Joi.string()
          .valid(...Object.keys(CorrespondenceTypes))
          .required(),
      })
    )
    .required(),
})

export const createSendCorrespondencesTaskHandler: RequestHandler = async (
  req,
  res
) => {
  const viewModel: BulkSendCorrespondenceViewModel = getValidatedData(
    requestSchema.required(),
    req.body
  )

  const promises = viewModel.toSend.map(async (toSend) => {
    const command: SendEmailCommand = {
      donationId: toSend.donationId,
      type: toSend.correspondenceType,
    }
    await publishMessage(command, 'email')
  })
  await Promise.all(promises)

  res.sendStatus(201)
}
