import config from 'config'
import { sumBy } from 'lodash'
import { v4 as createUuid } from 'uuid'
import { donationsRepository } from '../datastore/donations-repository'
import { GeneratePdfCommand } from '../models/commands/GeneratePdfCommand'
import { SendEmailCommand } from '../models/commands/SendEmailCommand'
import { CorrespondenceConfig } from '../models/config-models/Correspondence-config'
import { Donation, DonationType } from '../models/Donation'
import { Donor } from '../models/Donor'
import { Payment, PaymentSource } from '../models/Payment'
import { PaypalPaymentSource } from '../models/PaypalPaymentSource'
import { publishMessage } from '../pubsub/service'
import { addTime, HOUR } from '../utils/datetime'
import { logger } from '../utils/logging'

export interface CreatePaymentParams {
  externalId?: string
  sourceId?: string
  type: DonationType
  donor: Donor
  emailReceipt: boolean
  currency: string
  amount: number
  receiptAmount: number
  paymentDate: string
  source: PaymentSource
  reason?: string
  simulate?: boolean
  overrideFiscalYear?: number
}

async function createPayment(
  parameters: CreatePaymentParams
): Promise<Donation> {
  switch (parameters.type) {
    case 'one-time':
      logger.info('Creating one-time donation')
      return await createDonation(parameters)

    case 'recurrent':
      logger.info('Handling recurring donation')
      return await handleRecurringDonation(parameters)

    default:
      throw new Error(`Unhandled payment time ${parameters.type}`)
  }
}

async function createDonation(
  parameters: CreatePaymentParams
): Promise<Donation> {
  const donationId = createUuid()

  const newDonation = mapToDonation(donationId, parameters)
  const createdDonation = await donationsRepository.createDonation(
    newDonation,
    parameters.simulate || false
  )
  logger.info('Donation was created successfully', {
    donationId: createdDonation.id,
  })

  await triggerReceiptGenerationNextStep(
    createdDonation,
    parameters.type === 'recurrent'
  )

  return createdDonation
}

async function handleRecurringDonation(
  parameters: CreatePaymentParams
): Promise<Donation> {
  const externalId = parameters.externalId || ''
  const paymentDate = getPaymentDate(parameters.paymentDate)

  const donation = await donationsRepository.findDonationByExternalIdAndFiscalYear(
    externalId,
    parameters.overrideFiscalYear
      ? parameters.overrideFiscalYear
      : paymentDate.getFullYear()
  )

  if (donation) {
    logger.info(
      'Recurring donation already existed. Adding payment to the existing donation',
      { donationId: donation.id }
    )
    const updatedDonation = await addPaymentToDonation(donation, parameters)

    logger.info('Recurring donation updated', {
      donationId: updatedDonation.id,
    })

    return updatedDonation
  } else {
    logger.info(
      'Could not find any recurring donation for payment. Creating a new donation'
    )

    const createdDonation = await createDonation(parameters)

    logger.info('Recurring donation created', {
      donationId: createdDonation.id,
    })

    return createdDonation
  }
}

async function addPaymentToDonation(
  donation: Donation,
  parameters: CreatePaymentParams
): Promise<Donation> {
  donation.donor = parameters.donor

  const newPayment = mapToPayment(parameters)
  donation.payments.push(newPayment)

  const updatedDonation = await donationsRepository.updateDonation(
    donation,
    parameters.simulate
  )

  return updatedDonation
}

function getPaymentDate(toParse: string): Date {
  const paymentDate = new Date(toParse)
  if (isNaN(paymentDate.getTime())) {
    throw new Error(`Invalid payment date: ${toParse}`)
  }

  return paymentDate
}

function mapToDonation(
  donationId: string,
  parameters: CreatePaymentParams
): Donation {
  const paymentDate = getPaymentDate(parameters.paymentDate)

  // Adjusted for Pacific time in Canada. This is done to avoid having the wrong
  // fiscal year on Dec 31st.
  const adjustedPaymentDate = addTime(paymentDate, -8 * HOUR)

  const donation: Donation = {
    id: donationId,
    externalId: parameters.externalId || null,
    created: paymentDate,
    donor: parameters.donor,
    emailReceipt: parameters.emailReceipt,
    fiscalYear: parameters.overrideFiscalYear
      ? parameters.overrideFiscalYear
      : adjustedPaymentDate.getFullYear(),
    type: parameters.type,
    payments: [mapToPayment(parameters)],
    correspondences: [],
    documents: [],
    documentIds: [],
    reason: parameters.reason || null,
  }

  return donation
}

function mapToPayment(parameters: CreatePaymentParams): Payment {
  const payment: Payment = {
    amount: parameters.amount,
    receiptAmount: parameters.receiptAmount,
    currency: parameters.currency,
    date: getPaymentDate(parameters.paymentDate),
    source: parameters.source,
    sourceDetails: null,
  }

  if (parameters.source === 'paypal') {
    const paypalSource: PaypalPaymentSource = {
      id: parameters.sourceId || null,
    }

    payment.sourceDetails = paypalSource
  }

  return payment
}

/**
 * Depending on the state of the donation, triggers the next step for the PDF generation.
 *
 * If no mailing address is present on the donation, will trigger the email submission. Otherwise and
 * if the preventReceiptGeneration flag is set to false, will trigger the PDF receipt generation.
 * @param donation Donation for which to trigger the next receipt generation step
 * @param preventReceiptGeneration Flag to prevent the receipt from being generated (useful when payment is recurring and end of fiscal year has not been reached yet)
 */
async function triggerReceiptGenerationNextStep(
  donation: Donation,
  preventReceiptGeneration: boolean
): Promise<void> {
  const totalReceiptAmount = sumBy(
    donation.payments,
    (payment) => (payment.receiptAmount ?? 0) * 100
  )

  if (Math.floor(totalReceiptAmount) <= 0) {
    logger.info(
      'Donation has a total receipt amount set to 0. No receipt required.',
      {
        donationId: donation.id,
      }
    )
    return
  }

  const corrConfig = config.get<CorrespondenceConfig>('correspondence')
  if (!corrConfig.enabled) {
    logger.info('Correspondences are disabled in configuration')
    return
  }

  if (!donation.donor.address) {
    logger.info(
      'No mailing address found on the donation. Will send an email requesting the information',
      {
        donationId: donation.id,
      }
    )

    const command: SendEmailCommand = {
      donationId: donation.id,
      type: 'no-mailing-addr',
    }

    await publishMessage(command, 'email')
  } else if (!preventReceiptGeneration) {
    logger.info('Queuing PDF receipt generation', {
      donationId: donation.id,
    })

    const command: GeneratePdfCommand = {
      donationId: donation.id,
      queueEmailTransmission: donation.emailReceipt && !!donation.donor.email,
    }

    await publishMessage(command, 'pdf')
  }
}

export const paymentService = {
  createPayment,
}
