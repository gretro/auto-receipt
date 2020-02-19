import * as Joi from '@hapi/joi'
import {
  pipeMiddlewares,
  allowMethods,
  handleErrors,
  withApiToken,
  validateBody,
} from '../../utils/http'
import { donationsRepository } from '../../datastore/donations-repository'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { getFileProvider } from '../../providers/file'
import { sendEmail } from '../../providers/email/SendGridEmailProvider'
import { EOL } from 'os'

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

  const documentRef = donation.documents.find(doc => doc.id === vm.documentId)
  if (!documentRef) {
    throw new EntityNotFoundError('document', vm.documentId)
  }

  const fileProvider = await getFileProvider()
  const receipt = await fileProvider.loadDocument(documentRef.name)
  if (!receipt) {
    throw new EntityNotFoundError('document', documentRef.name)
  }

  // TODO: Use the abstraction instead
  await sendEmail({
    to: donation.donor.email || '',
    text: `Thank you for you donation to our organization. This is much appreciated.${EOL}${EOL}You will find attached to this email your fiscal receipt for the year ${donation.fiscalYear}. ${EOL}${EOL}Thank you again for your donation.`,
    subject: 'Thank you for your donation',
    attachments: [
      { name: 'receipt.pdf', contentType: 'application/pdf', data: receipt },
    ],
  })

  res.status(201).send()
})
