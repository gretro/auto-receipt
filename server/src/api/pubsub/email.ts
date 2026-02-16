import { RequestHandler } from 'express'
import Joi from 'joi'
import { SendEmailCommand } from '../../models/commands/SendEmailCommand'
import { CorrespondenceTypes } from '../../models/Correspondence'
import { correspondenceService } from '../../services/correspondence-service'
import { logger } from '../../utils/logging'
import { extractPubSubMessage } from './validation'

const sendEmailSchema = Joi.object<SendEmailCommand>({
  donationId: Joi.string().uuid().required(),
  type: Joi.string()
    .valid(...Object.keys(CorrespondenceTypes))
    .required(),
})

export const emailPubsubHandler: RequestHandler = async (req, res) => {
  logger.info('Received PubSub push for email')
  const message = extractPubSubMessage(sendEmailSchema, req.body)

  await sendEmail(message.data)

  res.sendStatus(200)
}

async function sendEmail(command: SendEmailCommand): Promise<void> {
  logger.info('Received email command', { command })

  const correspondence = await correspondenceService.sendEmail(
    command.donationId,
    command.type
  )

  logger.info('Completed email generation', {
    command,
    correspondenceId: correspondence.id,
  })
}
