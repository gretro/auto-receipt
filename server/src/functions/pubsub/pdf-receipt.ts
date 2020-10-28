import { HandlebarsError } from '../../errors/HandlebarsError'
import { GeneratePdfCommand } from '../../models/commands/GeneratePdfCommand'
import { SendEmailCommand } from '../../models/commands/SendEmailCommand'
import { getFileProvider } from '../../providers/file'
import { FileProvider } from '../../providers/file/FileProvider'
import { publishMessage } from '../../pubsub/service'
import { donationActivityService } from '../../services/donation-activity-service'
import { pdfService } from '../../services/pdf-service'
import {
  getCurrencyHelper,
  getDateHelper,
  getTranslateHelper,
  handlebarsFactory,
  Translations,
} from '../../utils/handlebars'
import { logger } from '../../utils/logging'
import { readJsonMessage } from '../../utils/pubsub'
import { PubSubHandler } from '../../utils/pubsub-function'

/**
 * Generates and saves a PDF based on a PubSubMessage
 * @param message PubSubMessage triggering the PDF generation
 * @todo Implement a soft retry
 * @todo Wrap the PubSubHandlers to allow for error handling and logging
 */
export const pdf: PubSubHandler = async (message) => {
  const command = readJsonMessage<GeneratePdfCommand>(message)
  logger.info('PDF Generation command received', { command })

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

  if (command.queueEmailTransmission) {
    const sendEmailCommand: SendEmailCommand = {
      donationId: command.donationId,
      type: 'thank-you',
    }
    await publishMessage(sendEmailCommand, 'email')
  }
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
    fileProvider.loadTemplate('receipt-pdf.hbs'),
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
