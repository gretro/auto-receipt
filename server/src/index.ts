import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import { registerDonationsRoutes } from './api/donations'
import { errorHandlerMiddleware } from './api/middlewares'
import { launchBulkImport } from './functions/http/bulk-import-donations'
import { createCheque } from './functions/http/create-cheque-donation'
import {
  bulkExportReceipts,
  downloadReceipt,
} from './functions/http/download-receipt'
import { generatePdfReceipt } from './functions/http/generate-pdf-receipt'
import { paypalIpn } from './functions/http/paypal-ipn'
import {
  getOrDeletePaypalReceiptConfig,
  upsertPaypalReceiptConfig,
} from './functions/http/paypal-receipt-config'
import { sendCorrespondence } from './functions/http/send-correspondence'
import { bulkImport } from './functions/pubsub/bulk-import'
import { email } from './functions/pubsub/email'
import { pdf } from './functions/pubsub/pdf-receipt'
import { subscribe } from './pubsub/service'
import { logger } from './utils/logging'

const app = express()

app.use(morgan('dev') as any)
app.use(bodyParser.urlencoded({ extended: true }) as any)
app.use(bodyParser.json() as any)

registerDonationsRoutes(app)

app.all('/paypalIpn', paypalIpn)
app.all('/createCheque', createCheque)
app.all('/generatePdfReceipt', generatePdfReceipt)
app.all('/sendCorrespondence', sendCorrespondence)
app.all('/launchBulkImport', launchBulkImport)
app.all('/downloadReceipt', downloadReceipt)
app.all('/bulkExportReceipts', bulkExportReceipts)
app.all('/upsertPaypalReceiptConfig', upsertPaypalReceiptConfig)
app.all('/getOrDeletePaypalReceiptConfig', getOrDeletePaypalReceiptConfig)

app.use(errorHandlerMiddleware)

async function main(): Promise<void> {
  app.listen(3001, () => {
    logger.info('Listening on port 3001')
  })

  await subscribe({
    pdf,
    bulkImport,
    email,
  })
}

main().catch((err) => {
  logger.error('Error while running server', err)
  process.exit(1)
})
