export interface PubSubSubscription {
  topic: string
  name: string
  endpoint: string
  retryOnFail?: boolean
}
