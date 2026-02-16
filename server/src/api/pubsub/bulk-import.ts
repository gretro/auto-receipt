import { RequestHandler } from 'express'
import Joi from 'joi'
import { BulkImportFormatHandler } from '../../bulk/donations/BulkImportFormatHandler'
import { donationCsvHandler } from '../../bulk/donations/csv/handler'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import {
  BulkImportCommand,
  BulkImportFormat,
  BulkImportFormats,
} from '../../models/commands/BulkImportCommand'
import { logger } from '../../utils/logging'
import { extractPubSubMessage } from './validation'

const bulkImportSchema = Joi.object<BulkImportCommand>({
  filename: Joi.string().required(),
  format: Joi.string()
    .valid(...Object.keys(BulkImportFormats))
    .required(),
})

const formatHandlers: Record<BulkImportFormat, BulkImportFormatHandler> = {
  'donation-csv': donationCsvHandler,
}

export const bulkImportPubsubHandler: RequestHandler = async (req, res) => {
  const message = extractPubSubMessage(bulkImportSchema, req.body)

  logger.info('Received PubSub push for bulk import')
  await bulkImport(message.data)

  res.sendStatus(200)
}

async function bulkImport(command: BulkImportCommand): Promise<void> {
  logger.info('Received bulk import command', { command })

  const handler = formatHandlers[command.format]
  if (!handler) {
    throw new EntityNotFoundError('Bulk import handler', command.format)
  }

  await handler(command.filename)

  logger.info('Completed bulk import', { command })
}
