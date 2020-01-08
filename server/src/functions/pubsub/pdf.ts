import { PubSubHandler } from '../../utils/pubsub-function'
import { readJsonMessage } from '../../utils/pubsub'
import { logger } from '../../utils/logging'

export interface GeneratePdfCommand {
  message: string
}

export const pdf: PubSubHandler = message => {
  const command = readJsonMessage<GeneratePdfCommand>(message)
  logger.info('PDF Generation command received', command)
}
