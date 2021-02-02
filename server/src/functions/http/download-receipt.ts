import * as Archiver from 'archiver'
import { Request, RequestHandler, Response } from 'express'
import * as Joi from 'joi'
import { donationActivityService } from '../../services/donation-activity-service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withAuth,
  withCORS,
} from '../../utils/http'
import { logger } from '../../utils/logging'

export const downloadReceipt: RequestHandler<any> = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('GET')
)(
  async (req: Request<any>, res: Response): Promise<void> => {
    const { donationId, documentId } = req.query

    if (!donationId || !documentId) {
      res.sendStatus(400)
      return
    }

    const {
      metadata,
      content,
    } = await donationActivityService.getDocumentContent(donationId, documentId)

    res.attachment(metadata.name)
    res.contentType('application/pdf')
    res.status(200)
    content.pipe(res, { end: true })
  }
)

interface BulkExportReceiptsSchema {
  receipts: { donationId: string; documentId: string }[]
}

const exportReceiptsSchema = Joi.object<BulkExportReceiptsSchema>({
  receipts: Joi.array()
    .min(1)
    .items(
      Joi.object({
        donationId: Joi.string().required(),
        documentId: Joi.string().required(),
      })
    )
    .required(),
})

export const bulkExportReceipts: RequestHandler<any> = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('POST'),
  validateBody(exportReceiptsSchema)
)(
  async (req: Request<any>, res: Response): Promise<void> => {
    const body: BulkExportReceiptsSchema = req.body

    const archive = Archiver('zip', { zlib: { level: 8 } })

    archive.on('entry', (event) =>
      logger.info(`Wrote file in archive: ${event.name}`, {
        event,
      })
    )

    archive.on('end', () => {
      logger.info(`Archive drained`)
    })

    archive.on('close', () =>
      logger.info('Archive finalized and closed', {
        bytes: archive.pointer(),
      })
    )

    archive.on('warning', (event) => {
      if (event.code === 'ENOENT') {
        logger.warn('ENOENT warning caught', { event })
      } else {
        throw event
      }
    })

    archive.on('error', (event) => {
      logger.error('Error while writing the archive', { event })
      throw event
    })

    const receiptPromises = body.receipts.map(
      async (receipt) =>
        await donationActivityService.getDocumentContent(
          receipt.donationId,
          receipt.documentId
        )
    )

    const receiptsInfo = await Promise.all(receiptPromises)

    res.attachment('receipts.zip')
    res.status(200)
    archive.pipe(res, { end: true })

    receiptsInfo.forEach((receiptInfo) => {
      archive.append(receiptInfo.content as any, {
        name: receiptInfo.metadata.name,
        date: receiptInfo.metadata.created,
      })
    })

    await archive.finalize()
  }
)
