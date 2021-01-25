import { Request, RequestHandler, Response } from 'express'
import { donationActivityService } from '../../services/donation-activity-service'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  withAuth,
} from '../../utils/http'

export const downloadReceipt: RequestHandler<any> = pipeMiddlewares(
  handleErrors(),
  withAuth(),
  allowMethods('GET')
)(
  async (req: Request<any>, res: Response): Promise<void> => {
    const { donationId, documentId } = req.query

    if (!donationId || !documentId) {
      res.sendStatus(400)
      return
    }

    const {
      metadata,
      content,
    } = await donationActivityService.getDocumentContent(donationId, documentId)

    res.attachment(metadata.name)
    res.contentType('application/pdf')
    res.status(200)
    content.pipe(res, { end: true })
  }
)
