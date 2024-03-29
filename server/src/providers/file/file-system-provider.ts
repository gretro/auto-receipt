import fs from 'fs'
import path from 'path'
import { Stream } from 'stream'
import { promisify } from 'util'
import { projectPath } from '../../project-path'
import { bufferToString, jsonBufferToObject } from '../../utils/buffer'
import { Translations } from '../../utils/handlebars'
import { logger } from '../../utils/logging'
import { FileProvider } from './FileProvider'

const fsExists = promisify(fs.exists)
const fsMkDir = promisify(fs.mkdir)
const fsReadFile = promisify(fs.readFile)
const fsWriteFile = promisify(fs.writeFile)

export interface FileSystemProviderOptions {
  translationsPath: string
  templatePath: string
  documentPath: string
  tempPath: string
}

function getAbsolutePath(pathToEvaluate: string): string {
  return path.isAbsolute(pathToEvaluate)
    ? pathToEvaluate
    : path.resolve(projectPath, pathToEvaluate)
}

async function readFile<T>(
  directory: string,
  fileName: string,
  objectType: string,
  mapper: (input: Buffer) => T
): Promise<T | undefined> {
  const filePath = path.resolve(directory, fileName)
  const fileExists = await fsExists(filePath)

  if (!fileExists) {
    logger.warn(`Could not find ${objectType} ${fileName} at '${filePath}'`)
    return undefined
  }

  const data: Buffer = await fsReadFile(filePath)
  logger.info(`Read ${objectType} ${fileName} successfully from '${filePath}'`)

  return mapper(data)
}

function readFileAsStream(directory: string, fileName: string): Stream {
  const filePath = path.resolve(directory, fileName)

  const stream = fs.createReadStream(filePath)
  return stream
}

async function saveFile(
  directory: string,
  fileName: string,
  objectType: string,
  data: Buffer
): Promise<void> {
  await fsMkDir(directory, { recursive: true })

  const filePath = path.resolve(directory, fileName)

  logger.info(`Writing ${objectType} ${fileName} to '${filePath}'`)

  await fsWriteFile(filePath, data, { encoding: 'utf8' })

  logger.info(`Wrote ${objectType} ${fileName} successfully`)
}

export function fileSystemProviderFactory(
  options: FileSystemProviderOptions
): Promise<FileProvider> {
  const resolvedOptions: FileSystemProviderOptions = {
    ...options,
    templatePath: getAbsolutePath(options.templatePath),
    documentPath: getAbsolutePath(options.documentPath),
    tempPath: getAbsolutePath(options.tempPath),
  }

  const provider: FileProvider = {
    loadTranslations: (name: string): Promise<Translations | undefined> =>
      readFile<Translations>(
        resolvedOptions.translationsPath,
        `${name}.json`,
        'translations',
        jsonBufferToObject
      ),
    loadTemplate: (name: string): Promise<string | undefined> =>
      readFile(
        resolvedOptions.templatePath,
        `${name}`,
        'template',
        bufferToString
      ),
    saveDocument: (name: string, data: Buffer): Promise<void> =>
      saveFile(resolvedOptions.documentPath, name, 'document', data),
    loadDocument: (name: string): Promise<Buffer | undefined> =>
      readFile(resolvedOptions.documentPath, name, 'document', (x) => x),
    loadDocumentAsStream: (name: string): Stream =>
      readFileAsStream(resolvedOptions.documentPath, name),
    loadTemp: (name: string): Stream =>
      readFileAsStream(resolvedOptions.tempPath, name),
  }

  return Promise.resolve(provider)
}
