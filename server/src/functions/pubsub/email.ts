import { SendEmailCommand } from '../../models/commands/SendEmailCommand'
import { correspondenceService } from '../../services/correspondence-service'
import { logger } from '../../utils/logging'
import { readJsonMessage } from '../../utils/pubsub'
import { PubSubHandler } from '../../utils/pubsub-function'

export const email: PubSubHandler = async (message): Promise<void> => {
  const command = readJsonMessage<SendEmailCommand>(message)

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
