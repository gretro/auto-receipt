import * as config from 'config'
import { InvalidConfigurationError } from '../../errors/InvalidConfigurationError'
import { EmailProvider } from './EmailProvider'
import { fakeEmailProvider } from './FakeEmailProvider'
import {
  sendGridEmailProviderFactory,
  SendGridOptions,
} from './SendGridEmailProvider'
import { smtpEmailProviderFactory, SmtpOptions } from './SmtpEmailProvider'

interface EmailProviderConfig {
  provider: 'sendGrid' | 'fake' | 'smtp'
  sendGrid?: SendGridOptions | null
  smtp?: SmtpOptions | null
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

    case 'smtp':
      return smtpEmailProviderFactory(emailProviderConfig.smtp)

    case 'fake':
      return fakeEmailProvider

    default:
      throw new Error(
        `Unknown email provider type ${emailProviderConfig.provider}`
      )
  }
}
