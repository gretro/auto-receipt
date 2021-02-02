import { createTransport, SendMailOptions } from 'nodemailer'
import { logger } from '../../utils/logging'
import { EmailProvider, SendEmailParams } from './EmailProvider'

export interface SmtpOptions {
  host: string
  port: number
  secure: boolean
  authUsername: string
  authPassword: string
  from?: string
  replyTo?: string
}

function buildMailOptions(
  options: SmtpOptions,
  params: SendEmailParams
): SendMailOptions {
  const mailOptions: SendMailOptions = {
    to: params.to,
    subject: params.subject,
  }

  if (options.from) {
    mailOptions.from = options.from
  }

  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo
  }

  if (params.html) {
    mailOptions.html = params.html
  }

  if (params.text) {
    mailOptions.text = params.text
  }

  if (params.attachments) {
    mailOptions.attachments = params.attachments.map((attachment) => {
      return {
        filename: attachment.name,
        content: attachment.data,
        contentType: attachment.contentType,
      }
    })
  }

  return mailOptions
}

export function smtpEmailProviderFactory(
  options?: SmtpOptions | null
): EmailProvider {
  if (!options) {
    throw new Error('SMTP Options are not set')
  }

  const transport = createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: {
      user: options.authUsername,
      pass: options.authPassword,
    },
  })

  return {
    async sendEmail(params: SendEmailParams): Promise<void> {
      const mailOptions = buildMailOptions(options, params)

      try {
        await transport.sendMail(mailOptions)
      } catch (err) {
        const message = err instanceof Error ? err.message : err
        const stackTrace = err instanceof Error ? err.stack : undefined
        const name = err instanceof Error ? err.name : undefined

        logger.error('Could not send email', {
          err: { message, stackTrace, name },
          provider: 'smtp',
        })
        throw new Error('Could not send email via SMTP')
      }
    },
  }
}
