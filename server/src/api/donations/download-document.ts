import { RequestHandler } from 'express'
import Joi from 'joi'
import { donationActivityService } from '../../services/donation-activity-service'
import { getValidatedParam } from '../../utils/validation'

export const downloadDocumentHandler: RequestHandler = async (req, res) => {
  const donationId = getValidatedParam(Joi.string().required(), req.params.id)
  const documentId = getValidatedParam(
    Joi.string().required(),
    req.params.documentId
  )

  const { metadata, content } =
    await donationActivityService.getDocumentContent(donationId, documentId)

  // TODO: Send signed URL to the client instead of streaming the file, but whatever
  res.attachment(metadata.name)
  res.contentType('application/pdf')
  res.status(200)
  content.pipe(res, { end: true })
}
