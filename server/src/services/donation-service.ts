import merge from 'lodash.merge'
import { donationsRepository } from '../datastore/donations-repository'
import { GeneratePdfCommand } from '../models/commands/GeneratePdfCommand'
import { DeepPartial } from '../models/DeepPartial'
import { Donation } from '../models/Donation'
import { publishMessage } from '../pubsub/service'
import { logger } from '../utils/logging'

async function patchDonation(
  donationId: string,
  patchDonation: DeepPartial<Donation>
): Promise<Donation> {
  const donation = await donationsRepository.getDonationById(donationId)
  const mustEmitReceipt =
    donation?.donor.address == null && patchDonation.donor?.address != null

  const mergedDonation = merge(donation, patchDonation)

  const updatedDonation = await donationsRepository.updateDonation(
    mergedDonation
  )

  if (mustEmitReceipt) {
    logger.info(
      'Patching address in a donation. Will emit the receipt with new donation information.'
    )

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
