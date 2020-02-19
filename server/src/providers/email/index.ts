import * as config from 'config'

import { EmailProvider } from './EmailProvider'
import {
  SendGridOptions,
  sendGridEmailProviderFactory,
} from './SendGridEmailProvider'
import { InvalidConfigurationError } from '../../errors/InvalidConfigurationError'

interface EmailProviderConfig {
  provider: 'sendGrid'
  sendGrid?: SendGridOptions | null
}

export function getEmailProvider(): EmailProvider {
  const emailProviderConfig = config.get<EmailProviderConfig>('providers.email')

  switch (emailProviderConfig.provider) {
    case 'sendGrid': {
      if (!emailProviderConfig.sendGrid) {
        throw new InvalidConfigurationError(
          'Could not find configuration for sendGrid email provider [providers.email.sendGrid]'
        )
      }

      return sendGridEmailProviderFactory(emailProviderConfig.sendGrid)
    }

    default:
      throw new Error(
        `Unknown email provider type ${emailProviderConfig.provider}`
      )
  }
}
