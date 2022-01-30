import config from 'config'
import { EmailProvider } from './EmailProvider'
import { fakeEmailProvider } from './FakeEmailProvider'
import { smtpEmailProviderFactory, SmtpOptions } from './SmtpEmailProvider'

interface EmailProviderConfig {
  provider: 'fake' | 'smtp'
  smtp?: SmtpOptions | null
}

export function getEmailProvider(): EmailProvider {
  const emailProviderConfig = config.get<EmailProviderConfig>('providers.email')

  switch (emailProviderConfig.provider) {
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
