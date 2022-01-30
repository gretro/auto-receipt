import { RequestHandler } from 'express'
import Joi from 'joi'
import {
  BulkImportCommand,
  bulkImportDonationFormatSchema,
  BulkImportFormat
} from '../../models/commands/BulkImportCommand'
import { publishMessage } from '../../pubsub/service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withAuth
} from '../../utils/http'

interface LaunchBulkImportViewModel {
  filename: string
  format: BulkImportFormat
}

const schema = Joi.object<LaunchBulkImportViewModel>({
  filename: Joi.string().required(),
  format: bulkImportDonationFormatSchema.required(),
})

export const launchBulkImport: RequestHandler = pipeMiddlewares(
  handleErrors(),
  withAuth(),
  allowMethods('POST'),
  validateBody(schema)
)(async (req, res) => {
  const body: LaunchBulkImportViewModel = req.body

  const command: BulkImportCommand = {
    filename: body.filename,
    format: body.format,
  }

  await publishMessage(command, 'bulkImport')

  res.status(201).send()
})
