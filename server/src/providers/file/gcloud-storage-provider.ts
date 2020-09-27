import { Bucket, Storage } from '@google-cloud/storage'
import * as path from 'path'
import { Stream } from 'stream'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { projectPath } from '../../project-path'
import { bufferToString, jsonBufferToObject } from '../../utils/buffer'
import { Translations } from '../../utils/handlebars'
import { logger } from '../../utils/logging'
import { FileProvider } from './FileProvider'

export interface GCloudProviderOptions {
  keyPath: string | null
  projectId: string | null
  translationsBucket: string
  templatesBucket: string
  documentsBucket: string
  tempBucket: string
  createBuckets: boolean
}

interface BucketRefs {
  translations: Bucket
  templates: Bucket
  documents: Bucket
  temp: Bucket
}

interface CacheEntry {
  created: Date
  expires: Date
  name: string
  data: unknown
}

const cache: Record<string, CacheEntry | undefined> = {}

async function readFile<T>(
  bucketRef: Bucket,
  filename: string,
  objectType: string,
  mapper: (input: Buffer) => T,
  useCache = false
): Promise<T | undefined> {
  const cacheKey = `${bucketRef.name}.${filename}`

  if (useCache) {
    const cachedEntry = retrieveFromCache<T>(cacheKey)
    if (cachedEntry) {
      logger.info(`Retrieved ${objectType} ${filename} from cache`)
      return cachedEntry
    }
  }

  const readFilePromise = new Promise<Buffer>((resolve, reject) => {
    const readStream = readFileAsStream(bucketRef, filename)
    const chunks: Buffer[] = []

    readStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    readStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    readStream.on('error', (err) => {
      logger.error(
        `Error reading ${objectType} ${filename} from bucket '${bucketRef.name}'`
      )
      reject(err)
    })
  })

  const buffer = await readFilePromise
  logger.info(
    `Read successfully ${objectType} ${filename} from bucket '${bucketRef.name}'`
  )

  const result = mapper(buffer)
  if (useCache) {
    logger.info(`Storing ${objectType} ${filename} in cache for 15 minutes`)
    storeInCache(cacheKey, result, 900)
  }

  return result
}

function readFileAsStream(bucketRef: Bucket, filename: string): Stream {
  const fileRef = bucketRef.file(filename)
  const stream = fileRef.createReadStream({ decompress: true })

  return stream
}

function retrieveFromCache<T>(cacheKey: string): T | undefined {
  const now = new Date()

  const cacheEntry = cache[cacheKey]
  if (cacheEntry) {
    if (cacheEntry.expires.getTime() - now.getTime() >= 0) {
      return cacheEntry.data as T
    } else {
      cache[cacheKey] = undefined
      return undefined
    }
  }

  return undefined
}

function storeInCache<T>(
  cacheKey: string,
  data: T,
  durationInSecs: number
): void {
  const expires = new Date()
  expires.setSeconds(expires.getSeconds() + durationInSecs)

  cache[cacheKey] = {
    created: new Date(),
    expires,
    data: data,
    name: cacheKey,
  }
}

async function saveFile(
  bucketRef: Bucket,
  filename: string,
  objectType: string,
  data: Buffer
): Promise<void> {
  const fileRef = bucketRef.file(filename)
  const writePromise = new Promise<void>((resolve, reject) => {
    const streamWriter = fileRef.createWriteStream({
      resumable: false,
      gzip: true,
    })

    streamWriter.on('error', (err) => {
      logger.error(
        `Error saving ${objectType} ${filename} in bucket '${bucketRef.name}'`
      )
      reject(err)
    })

    streamWriter.on('finish', () => {
      logger.info(
        `Wrote successfully ${objectType} ${filename} into bucket '${bucketRef.name}'`
      )
      resolve()
    })

    streamWriter.end(data)
  })

  return writePromise
}

export async function gCloudProviderFactory(
  options: GCloudProviderOptions
): Promise<FileProvider> {
  const storage = getConnection(options.keyPath, options.projectId)
  const buckets = await getBuckets(storage, options)

  return {
    loadTemplate: (filename): Promise<string | undefined> =>
      readFile(buckets.templates, `${filename}`, 'template', bufferToString),
    loadDocument: (filename): Promise<Buffer | undefined> =>
      readFile(buckets.documents, filename, 'document', (x) => x),
    saveDocument: (filename, data): Promise<void> =>
      saveFile(buckets.documents, filename, 'document', data),
    loadTranslations: (filename): Promise<Translations | undefined> =>
      readFile<Translations>(
        buckets.translations,
        `${filename}.json`,
        'translations',
        jsonBufferToObject
      ),
    loadTemp: (filename): Stream => readFileAsStream(buckets.temp, filename),
  }
}

function getConnection(
  keyPath: string | null,
  projectId: string | null
): Storage {
  let absKeyPath: string | null = null
  if (keyPath) {
    absKeyPath = path.isAbsolute(keyPath)
      ? keyPath
      : path.resolve(projectPath, keyPath)
  }

  const storage = new Storage(
    absKeyPath
      ? { keyFilename: absKeyPath, projectId: projectId || undefined }
      : undefined
  )
  return storage
}

async function getBuckets(
  storage: Storage,
  options: GCloudProviderOptions
): Promise<BucketRefs> {
  const allBuckets = [
    options.documentsBucket,
    options.templatesBucket,
    options.translationsBucket,
    options.tempBucket,
  ]

  const uniqueBuckets = allBuckets.reduce<Record<string, boolean>>(
    (acc, value) => {
      if (!acc[value]) {
        acc[value] = true
      }

      return acc
    },
    {}
  )

  const bucketPromises = Object.keys(uniqueBuckets).map(async (bucketName) => {
    const bucketRef = await getBucketRef(
      storage,
      bucketName,
      options.createBuckets
    )

    return { bucketName, bucketRef }
  })
  const bucketsRefInfo = await Promise.all(bucketPromises)

  const bucketRefs: Partial<BucketRefs> = {
    documents: bucketsRefInfo.find(
      (bucketInfo) => bucketInfo.bucketName === options.documentsBucket
    )?.bucketRef,
    templates: bucketsRefInfo.find(
      (bucketInfo) => bucketInfo.bucketName === options.templatesBucket
    )?.bucketRef,
    translations: bucketsRefInfo.find(
      (bucketInfo) => bucketInfo.bucketName === options.translationsBucket
    )?.bucketRef,
    temp: bucketsRefInfo.find(
      (bucketInfo) => bucketInfo.bucketName === options.tempBucket
    )?.bucketRef,
  }

  const mismatches = Object.entries(bucketRefs).filter(([, value]) => !value)
  if (mismatches.length > 0) {
    logger.error(
      'Some buckets could not be found',
      mismatches.map(([key]) => key)
    )
  }

  return bucketRefs as BucketRefs
}

async function getBucketRef(
  storage: Storage,
  bucketName: string,
  create: boolean
): Promise<Bucket> {
  const bucketRef = storage.bucket(bucketName)
  const [exists] = await bucketRef.exists()

  if (!exists) {
    if (!create) {
      throw new EntityNotFoundError('bucket', bucketName)
    }

    logger.warn(
      `Bucket ${bucketName} does not exist. It will be created. However, it is recommended you manually set up your buckets in order to configure them correctly for their usage`
    )
    const [success] = await bucketRef.create({ regional: true, standard: true })
    if (!success) {
      throw new Error(`Could not create bucket ${bucketName}`)
    }
  }

  return bucketRef
}
