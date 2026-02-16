import { Duration, PubSub, Topic } from '@google-cloud/pubsub'
import { ClientConfig } from '@google-cloud/pubsub/build/src/pubsub'
import config from 'config'
import { InvalidConfigurationError } from '../errors/InvalidConfigurationError'
import { TopicNotFoundError } from '../errors/TopicNotFoundError'
import { logger } from '../utils/logging'
import { PubSubSubscription } from './models'

export interface PubSubTopics {
  pdf: string
  bulkImport: string
  email: string
}

interface AppSubscriptions {
  pdf: PubSubSubscription | null
  bulkImport: PubSubSubscription | null
  email: PubSubSubscription | null
}

let pubsubClient: PubSub
let topics: PubSubTopics

function getClient(): PubSub {
  if (!pubsubClient) {
    let pubsubConfig: ClientConfig | null = null
    if (config.has('pubsub.client')) {
      pubsubConfig = config.get<ClientConfig>('pubsub.client')
    }

    pubsubClient = new PubSub(pubsubConfig || undefined)
  }

  return pubsubClient
}

function getTopicName(topicKey: keyof PubSubTopics): string {
  if (!topics) {
    topics = config.get<PubSubTopics>('pubsub.topics')
  }

  const topicName = topics[topicKey]
  if (!topicName) {
    throw new TopicNotFoundError(topicKey)
  }

  return topicName
}

async function getTopicByKey(topicKey: keyof PubSubTopics): Promise<Topic> {
  const topicName = getTopicName(topicKey)

  return await getTopicByName(topicName)
}

async function getTopicByName(topicName: string): Promise<Topic> {
  const client = getClient()
  const topic = client.topic(topicName)

  const [topicExists] = await topic.exists()
  if (!topicExists) {
    await topic.create()
  }

  return topic
}

export async function publishMessage(
  message: unknown,
  topicKey: keyof PubSubTopics
): Promise<void> {
  const topic = await getTopicByKey(topicKey)

  await topic.publishMessage({
    json: message,
  })
}

/**
 * Creates push subscriptions for all configured topics.
 * Only runs when `pubsub.createSubscriptions` is true in config.
 * Idempotent: skips subscriptions that already exist.
 */
export async function createPushSubscriptions(): Promise<void> {
  const shouldCreate = config.get<boolean>('pubsub.createSubscriptions')
  if (!shouldCreate) {
    logger.info(
      'Skipping PubSub push subscription creation (disabled in config)'
    )
    return
  }

  const pushEndpointBase = config.get<string>('pubsub.pushEndpointBase')
  if (!pushEndpointBase) {
    throw new InvalidConfigurationError(
      'pubsub.pushEndpointBase must be set when pubsub.createSubscriptions is true'
    )
  }

  const subscriptions = config.get<
    Record<keyof AppSubscriptions, PubSubSubscription>
  >('pubsub.subscriptions')

  for (const appSubInfo of Object.values(subscriptions)) {
    if (!appSubInfo) {
      continue
    }

    const topic = await getTopicByName(appSubInfo.topic)

    const subscription = topic.subscription(appSubInfo.name)
    const [subExists] = await subscription.exists()

    if (subExists) {
      logger.info(
        `Push subscription [${appSubInfo.name}] already exists, skipping`
      )
      continue
    }

    const pushEndpoint = `${pushEndpointBase}${appSubInfo.endpoint}`

    await subscription.create({
      pushConfig: { pushEndpoint },
      ackDeadlineSeconds: 60 * 5, // 5 minutes (to allow for PDF generation),
      retryPolicy: {
        maximumBackoff: Duration.from({ seconds: 10 }),
      },
    })

    logger.info(`Created push subscription [${appSubInfo.name}]`, {
      topic: appSubInfo.topic,
      pushEndpoint,
    })
  }
}
