import Joi from 'joi'
import { paypalReceiptConfigRepository } from '../../datastore/paypal-receipt-config-repository'
import {
  pipeMiddlewares,
  withCORS,
  handleErrors,
  withAuth,
  allowMethods,
  validateBody,
} from '../../utils/http'

interface UpsertPaypalReceiptConfigViewModel {
  paypalItemId: string
  receiptAmountFactor: number
}

const requestSchema = Joi.object<UpsertPaypalReceiptConfigViewModel>({
  paypalItemId: Joi.string().required(),
  receiptAmountFactor: Joi.number().min(0).max(1).required(),
})

export const upsertPaypalReceiptConfig = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('PUT'),
  validateBody(requestSchema)
)(
  async (req, res): Promise<void> => {
    const viewModel = req.body as UpsertPaypalReceiptConfigViewModel

    const result = await paypalReceiptConfigRepository.upsertPaypalReceiptConfigForItemId(
      viewModel
    )
    res.status(200).send(result)
  }
)

export const getOrDeletePaypalReceiptConfig = pipeMiddlewares(
  withCORS(),
  handleErrors(),
  withAuth(),
  allowMethods('GET', 'DELETE')
)(
  async (req, res): Promise<void> => {
    const id = req.query.id as string

    if (!id) {
      res.sendStatus(400)
      return
    }

    if (req.method.toUpperCase() === 'GET') {
      const maybeEntity = await paypalReceiptConfigRepository.findPaypalReceiptConfigByItemId(
        id
      )
      if (maybeEntity) {
        res.status(200).send(maybeEntity)
        return
      } else {
        res.sendStatus(404)
        return
      }
    } else if (req.method.toUpperCase() === 'DELETE') {
      await paypalReceiptConfigRepository.deletePaypalReceiptConfigByItemId(id)
      res.sendStatus(204)
      return
    }
  }
)
