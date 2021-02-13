import * as csvParse from 'csv-parse'
import { GeneratePdfCommand } from '../../../models/commands/GeneratePdfCommand'
import { getFileProvider } from '../../../providers/file'
import { publishMessage } from '../../../pubsub/service'
import {
  CreatePaymentParams,
  paymentService,
} from '../../../services/payment-service'
import { logger } from '../../../utils/logging'
import { BulkImportFormatHandler } from '../BulkImportFormatHandler'

const DEFAULT_SUPER_EVE = 'DONS 2019'
const RECURRING_PAYMENT_TYPE = 'Paypal recurring'
const DEFAULT_COUNTRY = 'Canada'

interface CsvData {
  NumDon: string
  RecuAEmettre: 'NON' | 'OUI'
  NO_DONAD: string
  Nom: string
  Prenom: string
  SuperEve: string
  Date_Inscription: string
  Mt_Reel: string
  Mt_Recu: string
  TypePaiement: string
  Adresse: string
  AdresseS: string
  Ville: string
  EtatProvince: string
  CodePostal: string
  Pays: string
}

export const donationCsvHandler: BulkImportFormatHandler = async (
  filename: string
): Promise<void> => {
  logger.info(`Started processing import of ${filename} in format CSV Temp 1`)

  const data = await parseCsvData(filename)
  await processData(data)

  logger.info('Done processing the import')
}

// We load all the data in memory. This is not ideal, but for now, it will do...
async function parseCsvData(filename: string): Promise<any[]> {
  const fileProvider = await getFileProvider()
  const fileStream = fileProvider.loadTemp(filename)
  const parserStream = csvParse({
    delimiter: ',',
    cast: false,
    columns: true,
    trim: true,
    skip_empty_lines: true,
  })

  return new Promise((resolve, reject) => {
    const data: CsvData[] = []

    parserStream.on('error', (err) => {
      logger.error('Error parsing the CSV', err)
      reject(err)
    })

    parserStream.on('end', () => {
      resolve(data)
    })

    parserStream.on('readable', () => {
      let record: CsvData
      while ((record = parserStream.read())) {
        if (record.RecuAEmettre.toUpperCase() !== 'NON') {
          data.push(record)
        }
      }
    })

    fileStream.pipe(parserStream)
  })
}

async function processData(csvData: CsvData[]): Promise<void> {
  const createPaymentParams = csvData.map(mapCsvDataToCreatePaymentParams)

  const validatePromises = createPaymentParams.map((params) =>
    paymentService.createPayment({ ...params, simulate: true })
  )

  await Promise.all(validatePromises)

  const donationIds: Record<string, boolean> = {}

  // We can't do it in parallel because of recurring payments
  for (const params of createPaymentParams) {
    const donation = await paymentService.createPayment(params)
    donationIds[donation.id] = true
  }

  logger.info(`Imported ${Object.keys(donationIds).length} donations`)

  const jobQueue = Object.keys(donationIds).map((donationId) => {
    const message: GeneratePdfCommand = {
      donationId,
      queueEmailTransmission: false,
    }

    return publishMessage(message, 'pdf')
  })

  await Promise.all(jobQueue)
}

function mapCsvDataToCreatePaymentParams(
  paymentData: CsvData
): CreatePaymentParams {
  const isRecurrent =
    paymentData.TypePaiement.toLowerCase() ===
    RECURRING_PAYMENT_TYPE.toLowerCase()

  const params: CreatePaymentParams = {
    amount: parseMoney(paymentData.Mt_Reel),
    receiptAmount: parseMoney(paymentData.Mt_Recu),
    currency: 'CAD',
    emailReceipt: false,
    paymentDate: parseDate(paymentData.Date_Inscription).toISOString(),
    source: 'unknown',
    type: isRecurrent ? 'recurrent' : 'one-time',
    externalId: `${paymentData.NO_DONAD.trim()}${isRecurrent ? '-REC' : ''}`,
    reason:
      paymentData.SuperEve.trim().toLowerCase() ===
      DEFAULT_SUPER_EVE.toLowerCase()
        ? undefined
        : paymentData.SuperEve.trim(),
    overrideFiscalYear: 2019,
    donor: {
      firstName: paymentData.Prenom.trim() || null,
      lastName: paymentData.Nom.trim(),
      email: null,
      address: paymentData.Adresse.trim()
        ? {
            line1: paymentData.Adresse.trim(),
            line2: paymentData.AdresseS.trim() || null,
            city: paymentData.Ville.trim().replace(/\//g, 'é'),
            state: paymentData.EtatProvince.trim().replace(/\//g, 'é') || null,
            country: paymentData.Pays || DEFAULT_COUNTRY,
            postalCode: paymentData.CodePostal.trim() || null,
          }
        : null,
    },
  }

  return params
}

function parseMoney(raw: string): number {
  const parseable = raw.replace(/[^0-9.]/g, '')
  return parseFloat(parseable)
}

function parseDate(raw: string): Date {
  const date = new Date(raw.trim())
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date ' + raw)
  }

  return date
}
