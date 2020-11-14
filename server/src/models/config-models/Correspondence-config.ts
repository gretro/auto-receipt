import { CorrespondenceType } from '../Correspondence'

export type CorrespondenceConfig = {
  enabled: boolean
} & {
  [K in CorrespondenceType]: CorrespondenceTypeConfig
}

export interface CorrespondenceTypeConfig {
  subject: string
}
