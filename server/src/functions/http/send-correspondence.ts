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
  handleErrors(),
  withAuth(),
  allowMethods('POST'),
  validateBody(vmSchema)
)(async (req, res) => {
  const viewModel: SendCorrespondenceViewModel = req.body
  await correspondenceService.sendEmail(
    viewModel.donationId,
    viewModel.correspondenceType
  )

  res.sendStatus(201)
})
