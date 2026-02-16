import Joi from 'joi'

export type BulkImportFormat = 'donation-csv'

export const BulkImportFormats = {
  'donation-csv': 'donation-csv',
}

export const bulkImportDonationFormatSchema = Joi.string().valid('donation-csv')

export interface BulkImportCommand {
  filename: string
  format: BulkImportFormat
}
