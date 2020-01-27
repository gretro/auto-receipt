export interface EmailAttachment {
  name: string
  data: Buffer
  contentType?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  content: string
  contentType: 'html' | 'text'
  attachments?: EmailAttachment[]
}

export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<void>
}
