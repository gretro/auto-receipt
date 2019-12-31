import * as createUuid from 'uuid/v4'
import { Donation, DonationType } from '../models/Donation'
import { Donor } from '../models/Donor'
import { Payment, PaymentSource } from '../models/Payment'
import { PaypalPaymentSource } from '../models/PaypalPaymentSource'
import { donationsRepository } from '../datastore/donations-repository'

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
}

async function createPayment(
  parameters: CreatePaymentParams
): Promise<Donation> {
  switch (parameters.type) {
    case 'one-time':
      return await createDonation(parameters)

    case 'recurrent':
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
  const entity = await donationsRepository.createDonation(newDonation)

  return entity
}

async function handleRecurringDonation(
  parameters: CreatePaymentParams
): Promise<Donation> {
  const externalId = parameters.externalId || ''
  const paymentDate = getPaymentDate(parameters.paymentDate)

  const donation = await donationsRepository.findDonationByExternalIdAndFiscalYear(
    externalId,
    paymentDate.getFullYear()
  )

  if (donation) {
    return await addPaymentToDonation(donation, parameters)
  } else {
    return await createDonation(parameters)
  }
}

async function addPaymentToDonation(
  donation: Donation,
  parameters: CreatePaymentParams
): Promise<Donation> {
  donation.donor = parameters.donor

  const newPayment = mapToPayment(parameters)
  donation.payments.push(newPayment)

  const updatedDonation = await donationsRepository.updateDonation(donation)
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
    fiscalYear: paymentDate.getFullYear(),
    type: parameters.type,
    payments: [mapToPayment(parameters)],
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