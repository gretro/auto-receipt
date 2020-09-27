export interface EmailAttachment {
  name: string
  data: Buffer
  contentType?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
}

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<void>
}
