import * as SendGrid from '@sendgrid/mail'
import { AttachmentData } from '@sendgrid/helpers/classes/attachment'
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
  await SendGrid.send({
    from: 'do-not-reply@autoreceipt.app',
    to: parameters.to,
    subject: parameters.subject,
    text: parameters.contentType === 'text' ? parameters.content : undefined,
    html: parameters.contentType === 'html' ? parameters.content : undefined,
    attachments,
  })
}
