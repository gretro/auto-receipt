import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import { errorHandlerMiddleware } from './api/middlewares'
import { registerPubsubRoutes } from './api/pubsub'
import { createPushSubscriptions } from './pubsub/service'
import { pdfService } from './services/pdf-service'
import { logger } from './utils/logging'

const app = express()

app.use(morgan('dev') as any)
app.use(bodyParser.urlencoded({ extended: true }) as any)
app.use(bodyParser.json() as any)

registerPubsubRoutes(app)

app.use(errorHandlerMiddleware)

async function main(): Promise<void> {
  await pdfService.initialize()

  const server = app.listen(3002, () => {
    logger.info('Worker listening on port 3002')
  })

  await createPushSubscriptions()

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
  logger.error('Error while running worker', err)
  pdfService.dispose()
  process.exit(1)
})
