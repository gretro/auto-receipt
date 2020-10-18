import * as config from 'config'
import { Firestore } from '@google-cloud/firestore'

let firestore: Firestore

function getConfiguration(): FirebaseFirestore.Settings | undefined {
  const hasConfig = config.has('firestore')

  if (!hasConfig) {
    return undefined
  }

  const dbSettings = config.get<FirebaseFirestore.Settings | null>('firestore')
  return dbSettings ?? undefined
}

export function getStore(): Firestore {
  if (!firestore) {
    const config = getConfiguration()
    firestore = new Firestore(config)
  }

  return firestore
}

export function getDonationsCollection(): FirebaseFirestore.CollectionReference {
  const store = getStore()
  return store.collection('donations')
}
