import * as config from 'config'

import { FileProvider } from './model'
import {
  FileSystemProviderOptions,
  fileSystemProviderFactory,
} from './file-system-provider'

interface FileProviderConfig {
  provider: 'file-system' | 'gcloud-storage'
  fs: FileSystemProviderOptions
  gcloud: unknown
}

let fileProvider: FileProvider | undefined = undefined

export function getFileProvider(): FileProvider {
  if (!fileProvider) {
    fileProvider = buildFileProvider()
  }

  return fileProvider
}

function buildFileProvider(): FileProvider {
  const providerConfig = config.get<FileProviderConfig>('providers.file')

  switch (providerConfig.provider) {
    case 'file-system':
      return fileSystemProviderFactory(providerConfig.fs)

    case 'gcloud-storage':
      throw new Error('GCloud Storage is not yet implemented')

    default:
      throw new Error(`Unknown file provider type: ${providerConfig.provider}`)
  }
}
