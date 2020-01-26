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

  const receiptInfo = mapDonationToReceiptInfo(donation)
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
    cultures: localeService.getLocales(),
    receipts: ['donor_receipt', 'federal_receipt', 'provincial_receipt'],
    receiptNumber: buildReceiptNumber(donation),
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

function buildReceiptNumber(donation: Donation): string {
  // Fiscal year + 8 first chars of donationId + revision (if necessary)
  const shortDonationId = donation.id.substr(0, 8).toUpperCase()
  const draftReceiptNumber = `${donation.fiscalYear}-${shortDonationId}`

  const similarDocs = donation.documents.filter(doc =>
    doc.id.startsWith(draftReceiptNumber)
  )
  return similarDocs.length === 0
    ? draftReceiptNumber
    : `${draftReceiptNumber}-R${similarDocs.length + 1}`
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
