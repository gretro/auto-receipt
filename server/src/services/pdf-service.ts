import * as chromium from 'chrome-aws-lambda'
import { Browser } from 'puppeteer-core'

import { donationsRepository } from '../datastore/donations-repository'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { ReceiptInfo } from '../models/ReceiptInfo'
import { Donation } from '../models/Donation'
import { logger } from '../utils/logging'
import { localeService } from './locale-service'
import { PdfGenerationError } from '../errors/PdfGenerationError'

async function getReceiptInfo(donationId: string): Promise<ReceiptInfo> {
  logger.info('Retrieving donation', { donationId })

  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', donationId)
  }

  const receiptNumber = await buildReceiptNumber(donation)

  const receiptInfo = mapDonationToReceiptInfo(donation, receiptNumber)
  return receiptInfo
}

function mapDonationToReceiptInfo(
  donation: Donation,
  receiptNumber: string
): ReceiptInfo {
  const lastPayment = donation.payments[donation.payments.length - 1]
  const {
    donationAmount,
    receiptAmount,
    donationCurrency,
  } = donation.payments.reduce(
    (acc, value) => {
      acc.donationAmount += value.amount
      acc.receiptAmount += value.receiptAmount

      if (acc.donationCurrency && acc.donationCurrency !== value.currency) {
        logger.warn('Donations received in multiple currencies', {
          donationId: donation.id,
        })
      }

      acc.donationCurrency = value.currency
      return acc
    },
    {
      donationAmount: 0,
      receiptAmount: 0,
      donationCurrency: '',
    }
  )

  const receiptInfo: ReceiptInfo = {
    cultures: localeService.getLocales(),
    receipts: ['donor_receipt', 'federal_receipt', 'provincial_receipt'],
    receiptNumber,
    receiptDate: new Date(),
    donationDate: lastPayment.date,
    donationAmount,
    receiptAmount,
    donationCurrency,
    isReasonDefined: false,
    reason: null,
    fiscalYear: donation.fiscalYear,
    donor: {
      firstName: donation.donor.firstName,
      lastName: donation.donor.lastName,
      address: donation.donor.address,
    },
  }

  return receiptInfo
}

/**
 * Builds a unique Receipt Number based on the name of the donor, with the fiscal year and a unique index number
 * @param donation Donation for which to build a receipt number
 */
async function buildReceiptNumber(donation: Donation): Promise<string> {
  const lastNamePart = donation.donor.lastName
    .substr(0, 3)
    .padEnd(3, 'X')
    .toUpperCase()

  const firstNamePart = donation.donor.firstName
    .substr(0, 2)
    .padStart(2, 'X')
    .toUpperCase()

  const receiptNumberPrefix = `${lastNamePart}${firstNamePart}${donation.fiscalYear}-`

  const indices = donation.documents
    .filter(doc => doc.id.startsWith(receiptNumberPrefix))
    .map(doc => {
      const rawIndex = doc.id.replace(receiptNumberPrefix, '')
      return parseInt(rawIndex)
    })
    .filter(index => !isNaN(index))
    .sort((x, y) => y - x)

  let isUnique = false
  let receiptNumber = ''
  let index = indices.length === 0 ? 0 : indices[0]

  do {
    index++
    const indexPart = index.toString().padStart(3, '0')

    receiptNumber = `${receiptNumberPrefix}${indexPart}`
    isUnique = await donationsRepository.isReceiptNumberUnique(receiptNumber)

    if (index > 999) {
      throw new Error(
        `Could not find any unique index for receipt number starting with '${receiptNumberPrefix}'`
      )
    }
  } while (!isUnique)

  return receiptNumber
}

async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  let browser: Browser | undefined = undefined
  let pdf: Buffer | undefined = undefined

  try {
    logger.info('Launching Puppeteer and Chromium')
    browser = await launchBrowser()

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    logger.info('Exporting as PDF')

    // TODO: Make configurable (maybe at some point...)
    pdf = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      },
    })

    logger.info('PDF successfully exported')
  } catch (err) {
    throw new PdfGenerationError(err)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  return pdf
}

async function launchBrowser(): Promise<Browser> {
  return chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: true,
  })
}

export const pdfService = {
  getReceiptInfo,
  generatePdfFromHtml,
}
