import { PubSubHandler } from '../../utils/pubsub-function'
import { readJsonMessage } from '../../utils/pubsub'
import { SendEmailCommand } from '../../models/commands/SendEmailCommand'
import { donationsRepository } from '../../datastore/donations-repository'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { emailReceiptService } from '../../services/email-receipt-service'
import { logger } from '../../utils/logging'

export const email: PubSubHandler = async (message): Promise<void> => {
  const command = readJsonMessage<SendEmailCommand>(message)
  const donation = await donationsRepository.getDonationById(command.donationId)

  if (!donation) {
    throw new EntityNotFoundError('Donation', command.donationId)
  }

  if (!donation.emailReceipt) {
    logger.info(
      `Donation ${donation.id} is set up to prevent submitting emails`
    )

    return
  }

  if (donation.donor.email == null) {
    logger.info(`Donation ${donation.id} has not email set up`)

    return
  }

  switch (command.type) {
    case 'receipt':
      await emailReceiptService.sendReceipt(donation, command.documentId)

    default:
      throw new Error(`Unknown correspondence type ${command.type}`)
  }
}
