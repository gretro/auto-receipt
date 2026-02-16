import { Application, Router } from 'express'
import { authMiddleware, corsMiddleware } from '../middlewares'
import { createDonationHandler } from './create-donation'
import { downloadDocumentHandler } from './download-document'
import { getDonationByIdHandler } from './get-donation'
import { listDonationsHandler } from './list-donations'
import { patchDonationHandler } from './patch-donation'

export function registerDonationsRoutes(app: Application): void {
  const router = Router()

  // Apply shared middleware to all routes under /donations
  router.use(corsMiddleware)
  router.use(authMiddleware)

  // Explicit OPTIONS for preflight (cors docs recommend when CORS isn't app-wide)
  router.options('/{*path}', corsMiddleware)
  router.get('/years/:year', listDonationsHandler)
  router.get('/:id', getDonationByIdHandler)
  router.get('/:id/documents/:documentId', downloadDocumentHandler)
  router.patch('/:id', patchDonationHandler)
  router.post('/', createDonationHandler)

  app.use('/api/donations', router)
}
