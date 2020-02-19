import * as config from 'config'
import { Donation } from '../models/Donation'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { DocumentMetadata } from '../models/DocumentMetadata'
import { getEmailProvider } from '../providers/email'

async function sendReceipt(
  donation: Donation,
  documentId?: string
): Promise<Donation> {
  const docToAttach = getDocument(donation, documentId)
  const correspondenceConfig = config.get
  
  const emailProvider = getEmailProvider()
  emailProvider.sendEmail({
    
}

function getDocument(
  donation: Donation,
  documentId?: string
): DocumentMetadata {
  if (documentId) {
    const document = donation.documents.find(doc => doc.id === documentId)
    if (!document) {
      throw new EntityNotFoundError('DocumentMetadata', documentId)
    }

    return document
  }

  if (donation.documents.length === 0) {
    throw new Error(`Donation ${donation.id} does not have any document`)
  }

  const mostRecentDoc = [...donation.documents].sort(
    (left, right) => right.created.getTime() - left.created.getTime()
  )[0]

  return mostRecentDoc
}

export const emailReceiptService = {
  sendReceipt,
}
