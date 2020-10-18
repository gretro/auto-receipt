import config from 'config'
import {
  fileSystemProviderFactory,
  FileSystemProviderOptions,
} from './file-system-provider'
import { FileProvider } from './FileProvider'
import {
  gCloudProviderFactory,
  GCloudProviderOptions,
} from './gcloud-storage-provider'

interface FileProviderConfig {
  provider: 'file-system' | 'gcloud-storage'
  fs?: FileSystemProviderOptions | null
  gcloud?: GCloudProviderOptions | null
}

let fileProvider: FileProvider | undefined = undefined

export async function getFileProvider(): Promise<FileProvider> {
  if (!fileProvider) {
    fileProvider = await buildFileProvider()
  }

  return fileProvider
}

function buildFileProvider(): Promise<FileProvider> {
  const providerConfig = config.get<FileProviderConfig>('providers.file')

  switch (providerConfig.provider) {
    case 'file-system':
      if (!providerConfig.fs) {
        throw new Error(
          'Could not find configuration for file-system file provider [providers.file.fs]'
        )
      }

      return fileSystemProviderFactory(providerConfig.fs)

    case 'gcloud-storage':
      if (!providerConfig.gcloud) {
        throw new Error(
          'Could not find configuration for GCloud Storage file provider [providers.file.gcloud]'
        )
      }

      return gCloudProviderFactory(providerConfig.gcloud)

    default:
      throw new Error(`Unknown file provider type: ${providerConfig.provider}`)
  }
}
