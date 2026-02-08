import { InvalidEntityError } from '../errors/InvalidEntityError'
import { Donation, donationSchema } from '../models/Donation'
import { mapTimestampToDate } from '../utils/firestore'
import { logger } from '../utils/logging'
import { Document } from './models'
import { getDonationsCollection } from './store'

async function findDonationByExternalIdAndFiscalYear(
  externalId: string,
  fiscalYear: number
): Promise<Donation | undefined> {
  const db = getDonationsCollection()
  const query = db
    .where('value.externalId', '==', externalId)
    .where('value.fiscalYear', '==', fiscalYear)

  const results = await query.get()
  if (results.empty) {
    return undefined
  }

  if (results.docs.length > 1) {
    logger.warn(`Found more than one donation with externalId ${externalId}`)
  }

  const donation = results.docs[0].data() as Document<Donation>
  return await extractDonationFromWrapper(donation)
}

async function getDonationsForFiscalYear(
  fiscalYear: number
): Promise<Donation[]> {
  const db = getDonationsCollection()
  const query = db
    .where('value.fiscalYear', '==', fiscalYear)
    .orderBy('value.created', 'desc')

  const results = await query.get()
  if (results.empty) {
    return []
  }

  const wrappers = results.docs.map((doc) => doc.data() as Document<Donation>)
  const extractionPromises = wrappers.map(extractDonationFromWrapper)

  return await Promise.all(extractionPromises)
}

export interface SearchDonationsParams {
  fiscalYear?: number
  externalId?: string
}

async function searchDonations(
  params: SearchDonationsParams
): Promise<Donation[]> {
  const db = getDonationsCollection()
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db

  if (params.fiscalYear) {
    query = query.where('value.fiscalYear', '==', params.fiscalYear)
  }
  if (params.externalId) {
    query = query.where('value.externalId', '==', params.externalId)
  }

  query = query.orderBy('value.created', 'desc')

  const results = await query.get()
  if (results.empty) {
    return []
  }

  const wrappers = results.docs.map((doc) => doc.data() as Document<Donation>)
  const extractionPromises = wrappers.map(extractDonationFromWrapper)

  return await Promise.all(extractionPromises)
}

async function getDonationById(id: string): Promise<Donation | undefined> {
  const db = getDonationsCollection()
  const docRef = db.doc(id)

  const snapshot = await docRef.get()
  if (!snapshot.exists) {
    return undefined
  }

  return await extractDonationFromWrapper(snapshot.data() as Document<Donation>)
}

async function extractDonationFromWrapper(
  wrapper: Document<Donation>
): Promise<Donation> {
  // Any version upgrade should occur here

  const donation = mapTimestampToDate(wrapper.value)
  donation.correspondences = donation.correspondences || []
  donation.documents = donation.documents || []
  donation.documentIds = donation.documentIds || []
  donation.reason = donation.reason || null

  return donation
}

async function createDonation(
  donation: Donation,
  simulate = false
): Promise<Donation> {
  const validationResult = donationSchema.validate(donation)
  if (validationResult.error) {
    throw new InvalidEntityError('Donation', validationResult)
  }

  if (simulate) {
    return donation
  }

  const db = getDonationsCollection()
  const docRef = db.doc(donation.id)

  const wrappedDocument: Document<Donation> = {
    version: 1,
    value: donation,
  }

  await docRef.set(wrappedDocument)

  const createdDonation = (await getDonationById(donation.id)) as Donation
  return createdDonation
}

async function updateDonation(
  donation: Donation,
  simulate = false
): Promise<Donation> {
  const validationResult = donationSchema.validate(donation)
  if (validationResult.error) {
    throw new InvalidEntityError('Donation', validationResult)
  }

  if (simulate) {
    return donation
  }

  const db = getDonationsCollection()
  const docRef = db.doc(donation.id)

  const wrappedDocument: Document<Donation> = {
    version: 1,
    value: donation,
  }

  await docRef.set(wrappedDocument)

  const updatedDonation = (await getDonationById(donation.id)) as Donation
  return updatedDonation
}

async function isReceiptNumberUnique(receiptNumber: string): Promise<boolean> {
  const db = getDonationsCollection()
  const query = db
    .where('value.documentIds', 'array-contains', receiptNumber)
    .select()

  const results = await query.get()
  return results.empty
}

export const donationsRepository = {
  listDonations: getDonationsForFiscalYear,
  searchDonations,
  getDonationById,
  findDonationByExternalIdAndFiscalYear,
  createDonation,
  updateDonation,
  isReceiptNumberUnique,
}
