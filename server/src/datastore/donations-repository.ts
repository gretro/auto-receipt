import { getDonationsCollection } from './store'
import { Document } from './models'
import { Donation, donationSchema } from '../models/Donation'
import { InvalidEntityError } from '../errors/InvalidEntityError'
import { mapTimestampToDate } from '../utils/firestore'
import { logger } from '../utils/logging'

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

  const wrappers = results.docs.map(doc => doc.data() as Document<Donation>)
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

  return mapTimestampToDate(wrapper.value)
}

async function createDonation(donation: Donation): Promise<Donation> {
  const validationResult = donationSchema.validate(donation)
  if (validationResult.error) {
    throw new InvalidEntityError('Donation', validationResult)
  }

  const db = getDonationsCollection()
  const docRef = db.doc(donation.id)

  const wrappedDocument: Document<Donation> = {
    version: 1,
    value: donation,
  }

  await docRef.create(wrappedDocument)

  const createdDonation = (await getDonationById(donation.id)) as Donation
  return createdDonation
}

async function updateDonation(donation: Donation): Promise<Donation> {
  const validationResult = donationSchema.validate(donation)
  if (validationResult.error) {
    throw new InvalidEntityError('Donation', validationResult)
  }

  const db = getDonationsCollection()
  const docRef = db.doc(donation.id)

  const wrappedDocument: Document<Donation> = {
    version: 1,
    value: donation,
  }

  await docRef.update(wrappedDocument)

  const updatedDonation = (await getDonationById(donation.id)) as Donation
  return updatedDonation
}

export const donationsRepository = {
  listDonations: getDonationsForFiscalYear,
  getDonationById,
  findDonationByExternalIdAndFiscalYear,
  createDonation,
  updateDonation,
}
