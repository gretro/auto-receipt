import { CorrespondenceType } from '../Correspondence'

export interface SendEmailCommand {
  donationId: string
  type: CorrespondenceType
}
