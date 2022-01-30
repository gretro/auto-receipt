import config from 'config'
import { UnsupportedLocaleError } from '../errors/UnsupportedLocaleError'
import { logger } from '../utils/logging'

interface LocaleConfig {
  locale: string
  test?: string
}

let loadedLocales: string[] | undefined = undefined

function getLocales(): string[] {
  if (!loadedLocales) {
    const locales = config.get<LocaleConfig[]>('locales')

    locales.forEach((locale) => {
      assertLocaleIsPresent(locale)
    })

    loadedLocales = locales.map((locale) => locale.locale)
  }

  return loadedLocales
}

function assertLocaleIsPresent(locale: LocaleConfig): void {
  if (!locale.test) {
    logger.warn(
      `No test for locale ${locale.locale}. Assuming it is installed correctly...`
    )

    return
  }

  const january = new Date('2019-01-15')
  const formatter = new Intl.DateTimeFormat(locale.locale, { month: 'long' })
  const formatted = formatter.format(january).toLowerCase()

  if (formatted !== locale.test.toLowerCase()) {
    throw new UnsupportedLocaleError(locale.locale)
  }
}

export const localeService = {
  getLocales,
}
