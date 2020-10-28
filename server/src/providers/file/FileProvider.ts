import { Stream } from 'stream'
import { Translations } from '../../utils/handlebars'

/**
 * Provider used to load and save files from an abstracted source (disk, cloud storage, etc)
 */
export interface FileProvider {
  /**
   * Loads translations from JSON file
   * @param name Name of the file (without the .json extension)
   */
  loadTranslations(name: string): Promise<Translations | undefined>

  /**
   * Loads a Handlebars template
   * @param name Template name (with the extension)
   */
  loadTemplate(name: string): Promise<string | undefined>

  /**
   * Saves a document using the file provider
   * @param name Name of the file to save
   * @param data Data to save
   */
  saveDocument(name: string, data: Buffer): Promise<void>

  /**
   * Loads a document using the file provider
   * @param name Name of the file to load
   */
  loadDocument(name: string): Promise<Buffer | undefined>

  /**
   * Loads a temporary document
   * @param name Name of the file to load (including extension)
   */
  loadTemp(name: string): Stream
}
