import * as _ from 'lodash'
import { donationsRepository } from '../datastore/donations-repository'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { GeneratePdfCommand } from '../models/commands/GeneratePdfCommand'
import { DeepPartial } from '../models/DeepPartial'
import { Donation } from '../models/Donation'
import { publishMessage } from '../pubsub/service'
import { logger } from '../utils/logging'

async function patchDonation(
  donationId: string,
  patchDonation: DeepPartial<Donation>,
  generateReceipt: boolean
): Promise<Donation> {
  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('Donation', donationId)
  }

  const mergedDonation = _.merge(donation, patchDonation)

  const updatedDonation = await donationsRepository.updateDonation(
    mergedDonation
  )

  if (generateReceipt && updatedDonation.type !== 'recurrent') {
    logger.info('Will emit the receipt with new donation information.')

    const generatePdfCommand: GeneratePdfCommand = {
      donationId,
      queueEmailTransmission: true,
    }

    await publishMessage(generatePdfCommand, 'pdf')
  }

  return updatedDonation
}

export const donationsService = {
  patchDonation,
}
