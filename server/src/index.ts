import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import { registerDonationsRoutes } from './api/donations'
import { errorHandlerMiddleware } from './api/middlewares'
import { registerPaypalRoutes } from './api/paypal'
import { registerTasksRoutes } from './api/tasks'
import { bulkImport } from './functions/pubsub/bulk-import'
import { email } from './functions/pubsub/email'
import { pdf } from './functions/pubsub/pdf-receipt'
import { subscribe } from './pubsub/service'
import { pdfService } from './services/pdf-service'
import { logger } from './utils/logging'

const app = express()

app.use(morgan('dev') as any)
app.use(bodyParser.urlencoded({ extended: true }) as any)
app.use(bodyParser.json() as any)

registerDonationsRoutes(app)
registerTasksRoutes(app)
registerPaypalRoutes(app)

app.use(errorHandlerMiddleware)

async function main(): Promise<void> {
  await pdfService.initialize()

  const server = app.listen(3001, () => {
    logger.info('Listening on port 3001')
  })

  await subscribe({
    pdf,
    bulkImport,
    email,
  })

  async function shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully...`)

    server.close(() => {
      logger.info('HTTP server closed')
    })

    await pdfService.dispose()
    logger.info('Shutdown complete')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  logger.error('Error while running server', err)
  pdfService.dispose()
  process.exit(1)
})
