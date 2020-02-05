import { EOL } from 'os'
import { PubSubHandler } from '../../utils/pubsub-function'
import { readJsonMessage } from '../../utils/pubsub'
import { logger } from '../../utils/logging'
import {
  handlebarsFactory,
  getCurrencyHelper,
  getDateHelper,
  getTranslateHelper,
  Translations,
} from '../../utils/handlebars'
import { pdfService } from '../../services/pdf-service'
import { getFileProvider } from '../../providers/file'
import { HandlebarsError } from '../../errors/HandlebarsError'
import { donationActivityService } from '../../services/donation-activity-service'
import { FileProvider } from '../../providers/file/FileProvider'
import { sendEmail } from '../../providers/email/SendGridEmailProvider'

export interface GeneratePdfCommand {
  donationId: string
  queueEmailTransmission: boolean
}

/**
 * Generates and saves a PDF based on a PubSubMessage
 * @param message PubSubMessage triggering the PDF generation
 * @todo Implement a soft retry
 */
export const pdf: PubSubHandler = async message => {
  const command = readJsonMessage<GeneratePdfCommand>(message)
  logger.info('PDF Generation command received', command)

  const fileProvider = await getFileProvider()
  const receiptContent = await getReceiptHtml(command.donationId, fileProvider)
  const pdf = await pdfService.generatePdfFromHtml(receiptContent.html)

  const filename = `receipt_${command.donationId}_${receiptContent.receiptNumber}.pdf`
  await fileProvider.saveDocument(filename, pdf)

  const donation = await donationActivityService.addDocument(
    command.donationId,
    receiptContent.receiptNumber,
    filename,
    `Fiscal receipt for ${receiptContent.fiscalYear}`
  )

  const content = [
    'Thank you for you donation to our organization. This is much appreciated.',
    `You will find attached to this email your fiscal receipt for the year ${donation.fiscalYear}.`,
    'Thank you again for your donation',
  ].reduce((acc, current) => {
    if (acc) {
      acc = `${acc}${EOL}${EOL}`
    }

    acc = `${acc}${current}`
    return acc
  }, '')

  // TODO: Queue email transmission in its own job
  logger.info('Sending receipt by email')
  await sendEmail({
    to: donation.donor.email || '',
    content,
    contentType: 'text',
    subject: 'Thank you for your donation',
    attachments: [
      { name: 'receipt.pdf', contentType: 'application/pdf', data: pdf },
    ],
  })
}

interface ReceiptContent {
  fiscalYear: number
  receiptNumber: string
  html: string
}

async function getReceiptHtml(
  donationId: string,
  fileProvider: FileProvider
): Promise<ReceiptContent> {
  const [receiptInfo, translations, template] = await Promise.all([
    pdfService.getReceiptInfo(donationId),
    fileProvider.loadTranslations('pdf-translations'),
    fileProvider.loadTemplate('receipt-pdf'),
  ])

  const handlebars = handlebarsFactory(
    getDateHelper(),
    getCurrencyHelper(),
    getTranslateHelper(translations as Translations)
  )

  try {
    const htmlGenerator = handlebars.compile(template, { strict: true })
    const html = htmlGenerator(receiptInfo)

    return {
      html,
      fiscalYear: receiptInfo!.fiscalYear,
      receiptNumber: receiptInfo!.receiptNumber,
    }
  } catch (err) {
    throw new HandlebarsError(err)
  }
}
