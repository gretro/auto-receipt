import * as Joi from 'joi'
import {
  CorrespondenceType,
  CorrespondenceTypes,
} from '../../models/Correspondence'
import { correspondenceService } from '../../services/correspondence-service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withAuth,
  withCORS,
} from '../../utils/http'

interface SendCorrespondenceViewModel {
  donationId: string
  correspondenceType: CorrespondenceType
}

const vmSchema = Joi.object<SendCorrespondenceViewModel>({
  donationId: Joi.string().required(),
  correspondenceType: Joi.string()
    .valid(...Object.keys(CorrespondenceTypes))
    .required(),
})

export const sendCorrespondence = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('POST'),
  validateBody(vmSchema)
)(async (req, res) => {
  const viewModel: SendCorrespondenceViewModel = req.body
  const correspondence = await correspondenceService.sendEmail(
    viewModel.donationId,
    viewModel.correspondenceType
  )

  res.status(201)
  res.send(correspondence)
})
