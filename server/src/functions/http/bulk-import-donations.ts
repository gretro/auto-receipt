import { RequestHandler } from 'express'
import * as Joi from '@hapi/joi'

import {
  pipeMiddlewares,
  handleErrors,
  withApiToken,
  allowMethods,
  validateBody,
} from '../../utils/http'
import {
  BulkImportCommand,
  BulkImportFormat,
  bulkImportDonationFormatSchema,
} from '../../models/commands/BulkImportCommand'
import { publishMessage } from '../../pubsub/service'

interface LaunchBulkImportViewModel {
  filename: string
  format: BulkImportFormat
}

const schema = Joi.object<LaunchBulkImportViewModel>({
  filename: Joi.string().required(),
  format: bulkImportDonationFormatSchema.required(),
})

export const launchBulkImport: RequestHandler<{}> = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
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
