import { Application, Router } from 'express'
import { bulkImportPubsubHandler } from './bulk-import'
import { emailPubsubHandler } from './email'
import { pdfPubsubHandler } from './pdf'

export function registerPubsubRoutes(app: Application): void {
  const router = Router()

  router.post('/pdf', pdfPubsubHandler)
  router.post('/email', emailPubsubHandler)
  router.post('/bulk-import', bulkImportPubsubHandler)

  app.use('/pubsub', router)
}
