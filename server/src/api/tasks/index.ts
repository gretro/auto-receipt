import { Application, Router } from 'express'
import { authMiddleware, corsMiddleware } from '../middlewares'
import { createBulkImportTaskHandler } from './create-bulk-import-task'
import { createGeneratePdfReceiptsTaskHandler } from './create-generate-pdf-receipts-task'
import { createSendCorrespondencesTaskHandler } from './create-send-correspondences-task'
import { exportReceiptsTaskHandler } from './export-receipts'

export function registerTasksRoutes(app: Application): void {
  const router = Router()

  router.use(corsMiddleware)
  router.use(authMiddleware)

  router.post('/bulk-import', createBulkImportTaskHandler)
  router.post('/generate-pdf-receipts', createGeneratePdfReceiptsTaskHandler)
  router.post('/send-correspondences', createSendCorrespondencesTaskHandler)
  router.post('/export-receipts', exportReceiptsTaskHandler)

  app.use('/api/tasks', router)
}
