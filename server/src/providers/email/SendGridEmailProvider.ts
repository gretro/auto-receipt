import { AttachmentData } from '@sendgrid/helpers/classes/attachment'
import * as SendGrid from '@sendgrid/mail'
import { MailDataRequired } from '@sendgrid/mail'
import { SendEmailParams } from './EmailProvider'

export async function sendEmail(parameters: SendEmailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error(
      'Twilio SendGrid API Key is not set. Make sure you include an environment variable named SENDGRID_API_KEY'
    )
  }

  const attachments: AttachmentData[] = (parameters.attachments || []).map(
    (att): AttachmentData => ({
      filename: att.name,
      content: att.data.toString('base64'),
      type: att.contentType,
    })
  )

  SendGrid.setApiKey(apiKey)
  
  const mailParams: MailDataRequired = {
    from: 'do-not-reply@autoreceipt.app',
    to: parameters.to,
    subject: parameters.subject,
    attachments,
    content: [{ type: parameters.contentType, value: parameters.content }]
  }

  await SendGrid.send(mailParams);
}
