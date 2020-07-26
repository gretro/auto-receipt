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
import { GeneratePdfCommand } from '../../models/commands/GeneratePdfCommand'

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

  const filename = `receipt_${receiptContent.receiptNumber}.pdf`
  await fileProvider.saveDocument(filename, pdf)

  await donationActivityService.addDocument(
    command.donationId,
    receiptContent.receiptNumber,
    filename,
    `Fiscal receipt for ${receiptContent.fiscalYear}`
  )

  // TODO: Queue email transmission in its own job
  // logger.info('Sending receipt by email')
  // const emailProvider = getEmailProvider()
  // await emailProvider.sendEmail({
  //   to: donation.donor.email || '',
  //   text: content,
  //   subject: 'Thank you for your donation',
  //   attachments: [
  //     { name: 'receipt.pdf', contentType: 'application/pdf', data: pdf },
  //   ],
  // })
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
    // TODO: Make those file names configurable
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
