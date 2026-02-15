import express, { Application } from 'express'
import { authMiddleware, corsMiddleware } from '../middlewares'
import { getDonationByIdHandler } from './get-donation'
import { listDonationsHandler } from './list-donations'
import { patchDonationHandler } from './patch-donation'

export function registerDonationsRoutes(app: Application): void {
  const router = express.Router()

  // Apply shared middleware to all routes under /donations
  router.use(corsMiddleware)
  router.use(authMiddleware)

  // handleErrors wraps each handler to catch async errors and call next(err)
  router.get('/years/:year', listDonationsHandler)
  router.get('/:id', getDonationByIdHandler)
  router.patch('/:id', patchDonationHandler)

  app.use('/api/donations', router)
}
