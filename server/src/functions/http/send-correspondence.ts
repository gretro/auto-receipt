import * as Joi from 'joi'
import { SendEmailCommand } from '../../models/commands/SendEmailCommand'
import {
  CorrespondenceType,
  CorrespondenceTypes,
} from '../../models/Correspondence'
import { publishMessage } from '../../pubsub/service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withAuth,
  withCORS,
} from '../../utils/http'

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

export const sendCorrespondence = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('POST'),
  validateBody(requestSchema)
)(async (req, res) => {
  const viewModel: BulkSendCorrespondenceViewModel = req.body

  const promises = viewModel.toSend.map(async (toSend) => {
    const command: SendEmailCommand = {
      donationId: toSend.donationId,
      type: toSend.correspondenceType,
    }
    await publishMessage(command, 'email')
  })
  await Promise.all(promises)

  res.sendStatus(201)
})
