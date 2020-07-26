import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as morgan from 'morgan'

import { paypalIpn } from './functions/http/paypal-ipn'
import { createCheque } from './functions/http/create-cheque-donation'
import { listDonations } from './functions/http/donation-management'
import { logger } from './utils/logging'
import { subscribe } from './pubsub/service'
import { pdf } from './functions/pubsub/pdf-receipt'
import { bulkImport } from './functions/pubsub/bulk-import'
import { generatePdfReceipt } from './functions/http/generate-pdf-receipt'
import { sendReceipt } from './functions/http/send-receipt'
import { launchBulkImport } from './functions/http/bulk-import-donations'

const app = express()

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/paypalIpn', paypalIpn)
app.all('/createCheque', createCheque)
app.all('/listDonations', listDonations)
app.all('/generatePdfReceipt', generatePdfReceipt)
app.all('/sendReceipt', sendReceipt)
app.all('/launchBulkImport', launchBulkImport)

async function main(): Promise<void> {
  app.listen(3000, () => {
    logger.info('Listening on port 3000')
  })

  await subscribe({
    pdf,
    bulkImport,
  })
}

main().catch(err => {
  logger.error('Error while running server', err)
  process.exit(1)
})
