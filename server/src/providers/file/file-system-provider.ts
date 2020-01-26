import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'
import { FileProvider } from './model'
import { projectPath } from '../../project-path'
import { logger } from '../../utils/logging'
import { StringDecoder } from 'string_decoder'
import { Translations } from '../../utils/handlebars'

const fsExists = promisify(fs.exists)
const fsMkDir = promisify(fs.mkdir)
const fsReadFile = promisify(fs.readFile)
const fsWriteFile = promisify(fs.writeFile)

export interface FileSystemProviderOptions {
  translationsPath: string
  templatePath: string
  documentPath: string
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

function bufferToString(buffer: Buffer): string {
  const decoder = new StringDecoder('utf8')
  const stringValue = decoder.end(buffer)
  return stringValue
}

function jsonBufferToObject<T>(buffer: Buffer): T {
  const json = bufferToString(buffer)
  const obj = JSON.parse(json)

  return obj
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
): FileProvider {
  const resolvedOptions: FileSystemProviderOptions = {
    ...options,
    templatePath: getAbsolutePath(options.templatePath),
    documentPath: getAbsolutePath(options.documentPath),
  }

  return {
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
        `${name}.hbs`,
        'template',
        bufferToString
      ),
    saveDocument: (name: string, data: Buffer): Promise<void> =>
      saveFile(resolvedOptions.documentPath, name, 'document', data),
    loadDocument: (name: string): Promise<Buffer | undefined> =>
      readFile(resolvedOptions.documentPath, name, 'document', x => x),
  }
}
