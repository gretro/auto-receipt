import * as SendGrid from '@sendgrid/mail'
import { AttachmentData } from '@sendgrid/helpers/classes/attachment'
import { SendEmailParams, EmailProvider } from './EmailProvider'
import { InvalidConfigurationError } from '../../errors/InvalidConfigurationError'

export interface SendGridOptions {
  apiKey: string
  from: string
  replyTo?: string
}

function getSendEmail(options: SendGridOptions) {
  return async (parameters: SendEmailParams): Promise<void> => {
    const attachments: AttachmentData[] = (parameters.attachments || []).map(
      (att): AttachmentData => ({
        filename: att.name,
        content: att.data.toString('base64'),
        type: att.contentType,
      })
    )

    await SendGrid.send({
      from: options.from,
      replyTo: options.replyTo,
      to: parameters.to,
      subject: parameters.subject,
      text: parameters.text,
      html: parameters.html,
      attachments,
    })
  }
}

export function sendGridEmailProviderFactory(
  options: SendGridOptions
): EmailProvider {
  if (!options.apiKey) {
    throw new InvalidConfigurationError('Invalid SendGrid API Key')
  }

  SendGrid.setApiKey(options.apiKey)

  return {
    sendEmail: getSendEmail(options),
  }
}
