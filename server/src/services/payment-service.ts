import * as createUuid from 'uuid/v4'
import { Donation, DonationType } from '../models/Donation'
import { Donor } from '../models/Donor'
import { Payment, PaymentSource } from '../models/Payment'
import { PaypalPaymentSource } from '../models/PaypalPaymentSource'
import { donationsRepository } from '../datastore/donations-repository'
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
  const entity = await donationsRepository.createDonation(
    newDonation,
    parameters.simulate || false
  )
  logger.info('Donation was created successfully', { donationId: entity.id })

  return entity
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

  const donation: Donation = {
    id: donationId,
    externalId: parameters.externalId || null,
    created: paymentDate,
    donor: parameters.donor,
    emailReceipt: parameters.emailReceipt,
    fiscalYear: parameters.overrideFiscalYear
      ? parameters.overrideFiscalYear
      : paymentDate.getFullYear(),
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

export const paymentService = {
  createPayment,
}
