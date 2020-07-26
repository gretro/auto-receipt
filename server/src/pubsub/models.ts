export interface PubSubSubscription {
  topic: string
  name: string
  retryOnFail?: boolean
}
