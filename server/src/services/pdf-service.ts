import {
  Browser as BrowserEnum,
  getInstalledBrowsers,
} from '@puppeteer/browsers'
import config from 'config'
import puppeteer, { Browser, Page } from 'puppeteer-core'
import { donationsRepository } from '../datastore/donations-repository'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { PdfGenerationError } from '../errors/PdfGenerationError'
import { Donation } from '../models/Donation'
import { ReceiptInfo } from '../models/ReceiptInfo'
import { projectPath } from '../project-path'
import { logger } from '../utils/logging'
import { localeService } from './locale-service'

let initialized = false
let browserPromise: Promise<Browser> | undefined = undefined
const MAX_BROWSERS = config.get<number>('chromium.maxInstances')
let WORKER_SLOTS: number[] = []
let slotId = 1

async function initialize(): Promise<void> {
  if (initialized) {
    return
  }

  initialized = true
  logger.info('Initializing PDF service')

  const browsers = await getInstalledBrowsers({ cacheDir: projectPath })
  const chrome = browsers.find((b) => b.browser === BrowserEnum.CHROME)
  if (!chrome) {
    throw new Error('Chrome not found')
  }

  logger.info('Chrome found', { chrome })

  browserPromise = puppeteer.launch({
    headless: true,
    browser: 'chrome',
    executablePath: chrome.executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  await browserPromise

  logger.info('PDF service initialized')
}

async function dispose(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise
    await browser.close()
    browserPromise = undefined
    WORKER_SLOTS = []
  }

  initialized = false
}

async function randomDelay(minSecs: number, maxSecs: number): Promise<void> {
  const duration =
    (((Math.random() * 100) % (maxSecs - minSecs)) + minSecs) * 1000
  return new Promise((resolve) => setTimeout(resolve, duration))
}

async function waitForRoom(): Promise<void> {
  while (WORKER_SLOTS.length >= MAX_BROWSERS) {
    logger.debug('Waiting for a browser slot to become available...')
    await randomDelay(1, 5)
  }
}

interface Worker {
  workerId: number
  page: Page
}

async function acquireWorker(): Promise<Worker> {
  logger.info('Acquiring worker slot', {
    browser: browserPromise,
  })

  await waitForRoom()

  if (!browserPromise) {
    throw new Error('Browser not initialized')
  }

  const workerId = slotId++
  WORKER_SLOTS.push(workerId)

  const browser = await browserPromise
  const page = await browser.newPage()

  return {
    workerId,
    page,
  }
}

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
  const { donationAmount, receiptAmount, donationCurrency } =
    donation.payments.reduce(
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
    receipts: ['receipt-1', 'receipt-2'],
    receiptNumber,
    receiptDate: new Date(),
    donationDate: lastPayment.date,
    donationAmount,
    receiptAmount,
    donationCurrency,
    isReasonDefined: !!donation.reason,
    reason: donation.reason,
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
    .replace(/[\s\/]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 3)
    .padEnd(3, 'X')
    .toUpperCase()

  // Some donations are made by companies. This means they have do not have a first name.
  // In this case, we use the continuation of the last name field
  const firstName =
    donation.donor.firstName || donation.donor.lastName.substring(3)

  const firstNamePart = firstName
    .replace(/[\s\/]/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 2)
    .padStart(2, 'X')
    .toUpperCase()

  const randomChars = new Array(3)
    .fill(null)
    .map(() => getRandomChar())
    .join('')

  const receiptNumberPrefix =
    `${lastNamePart}${firstNamePart}${donation.fiscalYear}-${randomChars}`.normalize(
      'NFD'
    )

  const indices = donation.documents
    .filter((doc) => doc.id.startsWith(receiptNumberPrefix))
    .map((doc) => {
      const rawIndex = doc.id.replace(receiptNumberPrefix, '')
      return parseInt(rawIndex)
    })
    .filter((index) => !isNaN(index))
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

function getRandomChar(): string {
  const index = Math.floor(Math.random() * 100) % 36
  const delta = index < 10 ? 48 : 65 - 10

  const char = String.fromCharCode(index + delta)
  return char
}

async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  let page: Page | undefined = undefined
  let workerId: number | undefined = undefined
  let pdf: Uint8Array | undefined = undefined

  try {
    const worker = await acquireWorker()
    page = worker.page
    workerId = worker.workerId

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    logger.info('Exporting as PDF')

    // TODO: Make configurable (maybe at some point...)
    pdf = await page.pdf({
      format: 'letter',
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
    if (page) {
      await page.close()
    }

    if (workerId) {
      WORKER_SLOTS = WORKER_SLOTS.filter((slot) => slot !== workerId)
    }
  }

  return Buffer.from(pdf)
}

export const pdfService = {
  initialize,
  dispose,
  getReceiptInfo,
  generatePdfFromHtml,
}
