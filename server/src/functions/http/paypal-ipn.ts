import axios from 'axios'
import config from 'config'
import { Request, Response } from 'express'
import PayPalIpn from 'paypal-ipn-types'
import { PayPalIpnVerificationError } from '../../errors/PayPalIpnVerificationError'
import { Address } from '../../models/Address'
import { DonationType } from '../../models/Donation'
import { PayPalConfig } from '../../models/PayPalConfig'
import {
  CreatePaymentParams,
  paymentService,
} from '../../services/payment-service'
import { getAppInfo } from '../../utils/app'
import { allowMethods, handleErrors, pipeMiddlewares } from '../../utils/http'
import { logger } from '../../utils/logging'
import FormData = require('form-data')
import { paypalReceiptConfigRepository } from '../../datastore/paypal-receipt-config-repository'

const paypalConfig = config.get<PayPalConfig>('paypal')

/**
 * Verify the payload recieved with PayPal to ensure that it is an authentic message
 *
 * @param ipnData The payload received for PayPal IPN via the webhook
 * @returns {Promise<boolean>} true if message is valid and can be processed, false if fake
 *
 */
async function isValid(ipnData: PayPalIpn): Promise<boolean> {
  if (!paypalConfig.validateIpn) {
    logger.warn('PAYPAL IPN NOT VALIDATED')
    return true
  }

  const appInfo = getAppInfo()
  const userAgent = `${appInfo.appName}/${appInfo.version}`

  const formData = new FormData()
  formData.append('cmd', '_notify-validate')
  Object.entries(ipnData).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await axios.post(paypalConfig.ipnUrl, formData, {
    headers: {
      'User-Agent': userAgent,
      'Content-Length': formData.getLengthSync(),
      ...formData.getHeaders(),
    },
    responseType: 'text',
  })

  const trimmedRes = String(response.data).trim()

  const isValid = trimmedRes === 'VERIFIED' // other return is INVALID. If it is INVALID it is probably spoofed

  if (!isValid) {
    logger.info('Paypal IPN validation request failed', {
      body: ipnData,
      response: {
        body: response.data,
        status: response.status,
        statusText: response.statusText,
      },
    })
  }

  return isValid
}

const messageHandlers: Record<string, (ipnData: PayPalIpn) => Promise<void>> = {
  web_accept: createPayment,
  recurring_payment: createPayment,
}

/**
 * PayPal IPN integration
 *
 * @see https://developer.paypal.com/docs/classic/products/instant-payment-notification/
 */
export const paypalIpn = pipeMiddlewares(
  handleErrors(),
  allowMethods('POST')
)(
  async (request: Request<any>, response: Response): Promise<void> => {
    const ipnData = request.body as PayPalIpn
    logger.info('Received PayPal IPN notification')

    if (ipnData.charset.toLowerCase() !== 'utf-8') {
      logger.warn(
        `Received IPN notification in ${ipnData.charset} encoding. Make sure you change this to UTF-8. Otherwise, this could cause issues (http://jlchereau.blogspot.com/2006/10/paypal-ipn-with-utf8.html)`
      )
    }

    const valid = await isValid(ipnData)
    if (!valid) {
      throw new PayPalIpnVerificationError(ipnData)
    }

    if (shouldProcessPayment(ipnData)) {
      logger.info('Payment will be processed')

      const handler = messageHandlers[ipnData.txn_type]
      if (handler) {
        await handler(ipnData)
      } else {
        logger.info(
          `Received transaction of type ${ipnData.txn_type} and did not have an action to take`
        )
      }
    } else {
      logger.info('Payment was ignored')
    }

    response.status(200).send().end()
  }
)

function shouldProcessPayment(ipnData: PayPalIpn): boolean {
  if (!paypalConfig.minFiscalYear) {
    return true
  }

  const paymentFiscalYear = new Date(ipnData.payment_date || '').getFullYear()
  if (isNaN(paymentFiscalYear)) {
    logger.error(
      `Unable to extract fiscal year from PayPal payment information`,
      ipnData.payment_date
    )
    return false
  }

  return paymentFiscalYear >= paypalConfig.minFiscalYear
}

/**
 * Invokes the payment service to create the payment
 * @param ipnData PayPal payment information
 * @todo Deal with Paypal's default encoding: Windows-1252. For now, I change the encoding to UTF-8 directly (http://jlchereau.blogspot.com/2006/10/paypal-ipn-with-utf8.html)
 */
async function createPayment(ipnData: PayPalIpn): Promise<void> {
  const amount = parseFloat(ipnData.mc_gross || '')
  const donationType = mapToDonationType(ipnData)

  // Handling special events that alters the receipt amount
  let receiptAmount = amount
  if (ipnData.item_number) {
    const maybeReceiptConfig = await paypalReceiptConfigRepository.findPaypalReceiptConfigByItemId(
      ipnData.item_number
    )

    if (maybeReceiptConfig) {
      receiptAmount =
        Math.floor(amount * maybeReceiptConfig.receiptAmountFactor * 100) / 100
    }
  }

  const createPayment: CreatePaymentParams = {
    donor: {
      firstName: ipnData.first_name || '',
      lastName: ipnData.last_name || '',
      email: ipnData.payer_email || '',
      address: mapToAddress(ipnData),
    },
    currency: ipnData.mc_currency || '',
    amount,
    receiptAmount,
    reason: ipnData.item_name || undefined,
    emailReceipt: true,
    paymentDate: ipnData.payment_date || '',
    type: donationType,
    source: 'paypal',
    sourceId: ipnData.receipt_id || ipnData.txn_id || '',
    externalId: getExternalId(donationType, ipnData),
  }

  await paymentService.createPayment(createPayment)
}

function mapToAddress(ipnData: PayPalIpn): Address | null {
  const fields = [
    ipnData.address_street,
    ipnData.address_city,
    ipnData.address_state,
    ipnData.address_country,
    ipnData.address_zip,
  ]

  const hasValidAddr = fields.every(Boolean)
  if (!hasValidAddr) {
    return null
  }

  return {
    line1: ipnData.address_street || '',
    line2: null, // PayPal combines both lines to address_street
    city: ipnData.address_city || '',
    state: ipnData.address_state || '',
    country: ipnData.address_country || '',
    postalCode: ipnData.address_zip || '',
  }
}

function mapToDonationType(ipnData: PayPalIpn): DonationType {
  switch (ipnData.txn_type) {
    case 'web_accept':
      return 'one-time'
    case 'recurring_payment':
      return 'recurrent'

    default:
      throw new Error(`Cannot map ${ipnData.txn_type} to a DonationType`)
  }
}

function getExternalId(
  donationType: DonationType,
  ipnData: PayPalIpn
): string | undefined {
  if (donationType === 'one-time') {
    return undefined
  }

  const externalId: string = (ipnData as any).recurring_payment_id || ''
  return externalId
}
