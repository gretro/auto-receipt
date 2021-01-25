import { Stream } from 'stream'
import { donationsRepository } from '../datastore/donations-repository'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { Correspondence } from '../models/Correspondence'
import { DocumentMetadata } from '../models/DocumentMetadata'
import { Donation } from '../models/Donation'
import { getFileProvider } from '../providers/file'
import { logger } from '../utils/logging'

async function addDocument(
  donationId: string,
  documentId: string,
  fileName: string,
  description?: string
): Promise<Donation> {
  logger.info('Adding document metadata to donation', {
    donationId,
    documentId,
    fileName,
    description,
  })

  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', donationId)
  }

  const document: DocumentMetadata = {
    id: documentId,
    created: new Date(),
    name: fileName,
    description: description || null,
  }
  donation.documents.push(document)
  donation.documentIds.push(document.id)
  const updated = await donationsRepository.updateDonation(donation)

  logger.info('Successfully added document metadata to donation', {
    donationId: updated.id,
    document,
  })

  return updated
}

async function getDocumentMetadata(
  donationId: string,
  documentId: string
): Promise<DocumentMetadata> {
  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', donationId)
  }

  const documentMetadata = donation.documents.find(
    (doc) => doc.id === documentId
  )
  if (!documentMetadata) {
    throw new EntityNotFoundError('document', `${donationId}.${documentId}`)
  }

  return documentMetadata
}

async function getDocumentContent(
  donationId: string,
  documentId: string
): Promise<{ metadata: DocumentMetadata; content: Stream }> {
  const documentMetadata = await getDocumentMetadata(donationId, documentId)

  const fileProvider = await getFileProvider()
  const stream = fileProvider.loadDocumentAsStream(documentMetadata.name)

  return { metadata: documentMetadata, content: stream }
}

async function addCorrespondence(
  donationId: string,
  correspondence: Correspondence
): Promise<Donation> {
  logger.info('Adding correspondence to donation', {
    donationId,
    correspondence,
  })

  const donation = await donationsRepository.getDonationById(donationId)
  if (!donation) {
    throw new EntityNotFoundError('donation', donationId)
  }

  donation.correspondences.push(correspondence)
  const updated = await donationsRepository.updateDonation(donation)

  logger.info('Successfully added correspondence to donation', {
    donationId: updated.id,
    correspondence,
  })

  return updated
}

export const donationActivityService = {
  addDocument,
  getDocumentMetadata,
  getDocumentContent,
  addCorrespondence,
}
