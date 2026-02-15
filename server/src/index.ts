import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import { registerDonationsRoutes } from './api/donations'
import { errorHandlerMiddleware } from './api/middlewares'
import { registerPaypalRoutes } from './api/paypal'
import { registerTasksRoutes } from './api/tasks'
import {
  getOrDeletePaypalReceiptConfig,
  upsertPaypalReceiptConfig,
} from './functions/http/paypal-receipt-config'
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
registerTasksRoutes(app)
registerPaypalRoutes(app)

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
