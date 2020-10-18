import * as Joi from 'joi'
import { donationsRepository } from '../../datastore/donations-repository'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { getFileProvider } from '../../providers/file'
import {
  allowMethods,
  handleErrors,
  pipeMiddlewares,
  validateBody,
  withApiToken,
} from '../../utils/http'

interface SendReceiptViewModel {
  donationId: string
  documentId: string
}

const vmSchema = Joi.object<SendReceiptViewModel>({
  donationId: Joi.string().required(),
  documentId: Joi.string().required(),
})

export const sendReceipt = pipeMiddlewares(
  handleErrors(),
  withApiToken(),
  allowMethods('POST'),
  validateBody(vmSchema)
)(async (req, res) => {
  const vm: SendReceiptViewModel = req.body
  const donation = await donationsRepository.getDonationById(vm.donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', vm.donationId)
  }

  if (!donation.emailReceipt) {
    throw new Error('Cannot send receipt by email')
  }

  const documentRef = donation.documents.find((doc) => doc.id === vm.documentId)
  if (!documentRef) {
    throw new EntityNotFoundError('document', vm.documentId)
  }

  const fileProvider = await getFileProvider()
  const receipt = await fileProvider.loadDocument(documentRef.name)
  if (!receipt) {
    throw new EntityNotFoundError('document', documentRef.name)
  }

  // TODO: Use the correspondence service to send email

  res.status(201).send()
})
