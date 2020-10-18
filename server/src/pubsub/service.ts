import { Message, PubSub, Topic } from '@google-cloud/pubsub'
import { ClientConfig } from '@google-cloud/pubsub/build/src/pubsub'
import * as config from 'config'
import { AppSubNotFoundError } from '../errors/AppSubNotFoundError'
import { InvalidConfigurationError } from '../errors/InvalidConfigurationError'
import { TopicNotFoundError } from '../errors/TopicNotFoundError'
import { logger } from '../utils/logging'
import { writeMessageAsJson } from '../utils/pubsub'
import {
  PubSubContext,
  PubSubHandler,
  PubSubMessage,
} from '../utils/pubsub-function'
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

export type AppSubHandlers = {
  [K in keyof AppSubscriptions]?: PubSubHandler
}

let pubsubClient: PubSub
let topics: PubSubTopics
let appSubs: AppSubscriptions
let subscribed = false

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

function getAppSub(subKey: keyof AppSubscriptions): PubSubSubscription {
  if (!appSubs) {
    appSubs = config.get<AppSubscriptions>('pubsub.subscriptions')
  }

  const subInfo = appSubs[subKey]
  if (!subInfo) {
    throw new AppSubNotFoundError(subKey)
  }

  if (!subInfo.name || !subInfo.topic) {
    throw new InvalidConfigurationError(
      `Invalid subscription information for subscription ${subKey}`
    )
  }

  return subInfo
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

  const msg = writeMessageAsJson(message)
  await topic.publish(msg)
}

export async function subscribe(
  handlers: AppSubHandlers
): Promise<() => Promise<void>> {
  if (subscribed) {
    throw new Error('Already subscribed')
  }

  subscribed = true

  const subscriptionPromises = Object.keys(handlers)
    .filter((handleyKey) => (handlers as any)[handleyKey])
    .map(async (handlerkey) => {
      const appSubInfo = getAppSub(handlerkey as any)
      const topic = await getTopicByName(appSubInfo.topic)

      const handler = (handlers as Record<string, PubSubHandler>)[handlerkey]

      const subscription = topic.subscription(appSubInfo.name)
      const [subExists] = await subscription.exists()
      if (!subExists) {
        await subscription.create({
          flowControl: { maxMessages: 5, allowExcessMessages: false },
        })
      }

      subscription.on('message', (message: Message) => {
        if (!appSubInfo.retryOnFail) {
          message.ack()
        }

        const ctx: PubSubContext = {
          eventId: message.id,
          eventType: 'publish',
          resource: '???',
          timestamp: message.publishTime.toISOString(),
        }

        const data: PubSubMessage = {
          attributes: message.attributes,
          data: message.data.toString('base64'),
        }

        Promise.resolve()
          .then(() => handler(data, ctx))
          .then(() => {
            if (appSubInfo.retryOnFail) {
              // No need to retry, we succeeded
              message.ack()
            }
          })
          .catch((err) => {
            logger.error(
              `Error executing subscription [${appSubInfo.name}] handler`,
              err
            )

            if (appSubInfo.retryOnFail) {
              message.nack()
            }
          })
      })

      return subscription
    })

  const allSubs = await Promise.all(subscriptionPromises)
  return async (): Promise<void> => {
    const unsubPromises = allSubs.map(async (sub) => {
      await sub.close()
      sub.removeAllListeners()
      await sub.delete()
    })

    await Promise.all(unsubPromises)
  }
}
