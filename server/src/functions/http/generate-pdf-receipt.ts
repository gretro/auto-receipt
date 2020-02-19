import { Request, Response } from 'express'
import * as Joi from '@hapi/joi'

import {
  pipeMiddlewares,
  handleErrors,
  withApiToken,
  allowMethods,
  validateBody,
} from '../../utils/http'
import { publishMessage } from '../../pubsub/service'
import { GeneratePdfCommand } from '../../models/commands/GeneratePdfCommand'

interface QueuePdfGenerationViewModel {
  donationId: string
  sendEmail: boolean
}

const queuePdfGenerationSchema = Joi.object<QueuePdfGenerationViewModel>({
  donationId: Joi.string().required(),
  sendEmail: Joi.boolean().required(),
})

export const generatePdfReceipt = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
  allowMethods('POST'),
  validateBody(queuePdfGenerationSchema)
)(
  async (req: Request<{}>, res: Response): Promise<void> => {
    const viewModel: QueuePdfGenerationViewModel = req.body

    const command: GeneratePdfCommand = {
      donationId: viewModel.donationId,
      queueEmailTransmission: viewModel.sendEmail,
    }

    await publishMessage(command, 'pdf')

    res.status(201).send()
  }
)
