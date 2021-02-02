import { logger } from '../../utils/logging'
import { EmailProvider } from './EmailProvider'

export const fakeEmailProvider: EmailProvider = {
  sendEmail: (params) => {
    logger.info('Sending email', {
      ...params,
      attachments: params.attachments?.map((attachment) => attachment.name),
    })

    return Promise.resolve()
  },
}
