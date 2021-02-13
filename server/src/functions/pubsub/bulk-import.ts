import { BulkImportFormatHandler } from '../../bulk/donations/BulkImportFormatHandler'
import { donationCsvHandler } from '../../bulk/donations/csv/handler'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import {
  BulkImportCommand,
  BulkImportFormat,
} from '../../models/commands/BulkImportCommand'
import { readJsonMessage } from '../../utils/pubsub'
import { PubSubHandler } from '../../utils/pubsub-function'

const formatHandlers: Record<BulkImportFormat, BulkImportFormatHandler> = {
  'donation-csv': donationCsvHandler,
}

export const bulkImport: PubSubHandler = async (message) => {
  const command = readJsonMessage<BulkImportCommand>(message)

  const handler = formatHandlers[command.format]
  if (!handler) {
    throw new EntityNotFoundError('Bulk import handler', command.format)
  }

  await handler(command.filename)
}
