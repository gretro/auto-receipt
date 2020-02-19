import { CorrespondenceSubject } from '../Correspondence'

export interface SendEmailCommand {
  donationId: string
  type: CorrespondenceSubject
  documentId?: string
}
