import * as getUuid from 'uuid/v4'
import { getDonationsCollection } from './store'
import { Donation } from '../models'

export async function createDonation(donation: Donation): Promise<void> {
  const uuid = getUuid()

  const db = getDonationsCollection()
  const docRef = db.doc(uuid)
  await docRef.create(donation)
}
