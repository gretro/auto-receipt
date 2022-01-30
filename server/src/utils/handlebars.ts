import Handlebars from 'handlebars'
import { logger } from './logging'

export interface HandlebarsHelper {
  name: string
  delegate: Handlebars.HelperDelegate
}

export function getDateHelper(): HandlebarsHelper {
  return {
    name: 'date',
    delegate: (date: Date, culture: string): Handlebars.SafeString => {
      const formattedDate = date.toLocaleDateString(culture, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      return new Handlebars.SafeString(formattedDate)
    },
  }
}
export function getCurrencyHelper(): HandlebarsHelper {
  return {
    name: 'currency',
    delegate: (
      amount: number,
      culture: string,
      currency: string
    ): Handlebars.SafeString => {
      const formattedAmount = amount.toLocaleString(culture, {
        style: 'currency',
        currency: currency,
      })

      return new Handlebars.SafeString(formattedAmount)
    },
  }
}

export type Translations = Record<string, Record<string, string>>

export function getTranslateHelper(
  translations: Translations
): HandlebarsHelper {
  return {
    name: 'translate',
    delegate: (code: string, culture: string): Handlebars.SafeString => {
      const language = translations[culture]
      let value = language[code]

      if (!value) {
        logger.warn(
          `Translation failed to find a value for code '${code}' in ${culture}`
        )

        value = `<(${code})>`
      }

      return new Handlebars.SafeString(value)
    },
  }
}

export function handlebarsFactory(
  ...helpers: HandlebarsHelper[]
): typeof Handlebars {
  const instance = Handlebars.create()

  helpers.forEach((helper) => {
    instance.registerHelper(helper.name, helper.delegate)
  })

  return instance
}
