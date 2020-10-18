import { AttachmentData } from '@sendgrid/helpers/classes/attachment'
import SendGrid, { MailDataRequired } from '@sendgrid/mail'
import { EmailProvider, SendEmailParams } from './EmailProvider'

export interface SendGridOptions {
  apiKey: string
  from: string
  replyTo: string
}

export function sendGridEmailProviderFactory(
  options: SendGridOptions | null
): EmailProvider {
  if (!options) {
    throw new Error('SendGrid options are not set')
  }

  const apiKey = options.apiKey
  if (!apiKey) {
    throw new Error(
      'Twilio SendGrid API Key is not set. Make sure you include an environment variable named SENDGRID_API_KEY'
    )
  }
  SendGrid.setApiKey(apiKey)

  return {
    sendEmail: async (parameters: SendEmailParams): Promise<void> => {
      const attachments: AttachmentData[] = (parameters.attachments || []).map(
        (att): AttachmentData => ({
          filename: att.name,
          content: att.data.toString('base64'),
          type: att.contentType,
          disposition: 'attachment',
        })
      )

      SendGrid.setApiKey(apiKey)

      if (!parameters.html && !parameters.text) {
        throw new Error(
          'No content was set. Make sure to provide html, text or both'
        )
      }

      const content: MailDataRequired['content'] = []
      if (parameters.html) {
        content.push({ type: 'text/html', value: parameters.html })
      }
      if (parameters.text) {
        content.push({ type: 'text/plain', value: parameters.text })
      }

      const mailParams: MailDataRequired = {
        from: options.from,
        replyTo: options.replyTo,
        to: parameters.to,
        subject: parameters.subject,
        attachments,
        content: content as any,
      }

      await SendGrid.send(mailParams)
    },
  }
}
