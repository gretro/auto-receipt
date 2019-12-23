import * as config from 'config'
import { Firestore } from '@google-cloud/firestore'

let firestore: Firestore

export function getStore(): Firestore {
  if (!firestore) {
    const dbSettings = config.get<FirebaseFirestore.Settings>('firestore')
    firestore = new Firestore(dbSettings)
  }

  return firestore
}

export function getDonationsCollection(): FirebaseFirestore.CollectionReference {
  const store = getStore()
  return store.collection('donations')
}
