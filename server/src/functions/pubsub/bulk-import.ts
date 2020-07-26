import { PubSubHandler } from '../../utils/pubsub-function'
import { readJsonMessage } from '../../utils/pubsub'
import {
  BulkImportCommand,
  BulkImportFormat,
} from '../../models/commands/BulkImportCommand'
import { BulkImportFormatHandler } from '../../bulk/donations/BulkImportFormatHandler'
import { donationCsvHandler } from '../../bulk/donations/csv/handler'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'

const formatHandlers: Record<BulkImportFormat, BulkImportFormatHandler> = {
  'donation-csv': donationCsvHandler,
}

export const bulkImport: PubSubHandler = async message => {
  const command = readJsonMessage<BulkImportCommand>(message)

  const handler = formatHandlers[command.format]
  if (!handler) {
    throw new EntityNotFoundError('Bulk import handler', command.format)
  }

  await handler(command.filename)
}
