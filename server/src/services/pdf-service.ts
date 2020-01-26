import * as chromium from 'chrome-aws-lambda'
import { Browser } from 'puppeteer-core'

import { donationsRepository } from '../datastore/donations-repository'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { ReceiptInfo } from '../models/ReceiptInfo'
import { Donation } from '../models/Donation'
import { logger } from '../utils/logging'
import { localeService } from './locale-service'
import { PdfGenerationError } from '../errors/PdfGenerationError'

async function getReceiptInfo(
  donationId: string,
  receiptNumber: string
): Promise<ReceiptInfo> {
  logger.info('Retrieving donation', { donationId })

  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', donationId)
  }

  const receiptInfo = mapDonationToReceiptInfo(donation)

  receiptInfo.cultures = localeService.getLocales()
  receiptInfo.receiptNumber = receiptNumber
  receiptInfo.receipts = [
    'donor_receipt',
    'federal_receipt',
    'provincial_receipt',
  ]

  return receiptInfo
}

function mapDonationToReceiptInfo(donation: Donation): ReceiptInfo {
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
    cultures: [],
    receipts: [],
    receiptNumber: '',
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

async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  let browser: Browser | undefined = undefined
  let pdf: Buffer | undefined = undefined

  try {
    logger.info('Launching Puppeteer and Chromium')
    browser = await launchBrowser()

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    logger.info('Exporting as PDF')

    // TODO: Make configurable
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
