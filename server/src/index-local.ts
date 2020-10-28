import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as morgan from 'morgan'
import { launchBulkImport } from './functions/http/bulk-import-donations'
import { createCheque } from './functions/http/create-cheque-donation'
import {
  getDonation,
  listDonations,
} from './functions/http/donation-management'
import { generatePdfReceipt } from './functions/http/generate-pdf-receipt'
import { patchDonation } from './functions/http/patch-donation'
import { paypalIpn } from './functions/http/paypal-ipn'
import { sendReceipt } from './functions/http/send-receipt'
import { bulkImport } from './functions/pubsub/bulk-import'
import { email } from './functions/pubsub/email'
import { pdf } from './functions/pubsub/pdf-receipt'
import { subscribe } from './pubsub/service'
import { logger } from './utils/logging'

const app = express()

app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.all('/paypalIpn', paypalIpn)
app.all('/createCheque', createCheque)
app.all('/listDonations', listDonations)
app.all('/getDonation', getDonation)
app.all('/generatePdfReceipt', generatePdfReceipt)
app.all('/sendReceipt', sendReceipt)
app.all('/launchBulkImport', launchBulkImport)
app.all('/patchDonation', patchDonation)

async function main(): Promise<void> {
  app.listen(3000, () => {
    logger.info('Listening on port 3000')
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
