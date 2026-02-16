import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import { registerDonationsRoutes } from './api/donations'
import { errorHandlerMiddleware } from './api/middlewares'
import { registerPaypalRoutes } from './api/paypal'
import { registerTasksRoutes } from './api/tasks'
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
  const server = app.listen(3001, () => {
    logger.info('API listening on port 3001')
  })

  async function shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully...`)

    server.close(() => {
      logger.info('HTTP server closed')
    })

    logger.info('Shutdown complete')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  logger.error('Error while running API', err)
  process.exit(1)
})
