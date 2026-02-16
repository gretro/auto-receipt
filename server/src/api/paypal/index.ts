import { Application, Router } from 'express'
import { authMiddleware, corsMiddleware } from '../middlewares'
import { deletePaypalReceiptConfigHandler } from './config/delete-paypal-receipt-config'
import { getPaypalReceiptConfigHandler } from './config/get-paypal-receipt-config'
import { upsertPaypalReceiptConfigHandler } from './config/upsert-paypal-receipt-config'
import { paypalIPNHandler } from './ipn'

export function registerPaypalRoutes(app: Application): void {
  app.post('/api/paypal/ipn', paypalIPNHandler)

  const configRouter = Router()

  configRouter.use(corsMiddleware)
  configRouter.use(authMiddleware)

  configRouter.options('/{*path}', corsMiddleware)
  configRouter.put('/', upsertPaypalReceiptConfigHandler)
  configRouter.get('/:id', getPaypalReceiptConfigHandler)
  configRouter.delete('/:id', deletePaypalReceiptConfigHandler)

  app.use('/api/paypal/config', configRouter)
}
