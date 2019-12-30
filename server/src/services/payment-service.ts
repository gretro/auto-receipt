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
      return await handleOneTimeDonation(parameters)

    default:
      throw new Error(`Unhandled payment time ${parameters.type}`)
  }
}

async function handleOneTimeDonation(
  parameters: CreatePaymentParams
): Promise<Donation> {
  const donationId = createUuid()

  // We may want to account for timezone...
  const now = new Date()

  const newDonation = mapToDonation(donationId, now, parameters)
  const entity = await donationsRepository.createDonation(newDonation)

  return entity
}

function mapToDonation(
  donationId: string,
  now: Date,
  parameters: CreatePaymentParams
): Donation {
  const donation: Donation = {
    id: donationId,
    externalId: parameters.externalId || null,
    created: now,
    donor: parameters.donor,
    emailReceipt: parameters.emailReceipt,
    fiscalYear: now.getFullYear(),
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
    date: new Date(parameters.paymentDate),
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
