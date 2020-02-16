import * as Joi from '@hapi/joi'

export type BulkImportFormat = 'donation-csv'

export const bulkImportDonationFormatSchema = Joi.string().valid('donation-csv')

export interface BulkImportCommand {
  filename: string
  format: BulkImportFormat
}
