import Archiver from 'archiver'
import { RequestHandler } from 'express'
import Joi from 'joi'
import { donationActivityService } from '../../services/donation-activity-service'
import { logger } from '../../utils/logging'
import { getValidatedData } from '../../utils/validation'

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

export const exportReceiptsTaskHandler: RequestHandler = async (req, res) => {
  const body = getValidatedData(exportReceiptsSchema.required(), req.body)

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
