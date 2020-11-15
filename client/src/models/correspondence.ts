export const CorrespondenceTypes = {
  'no-mailing-addr': 'no-mailing-addr',
  'thank-you': 'thank-you',
};

export type CorrespondenceType = keyof typeof CorrespondenceTypes;

export const CorrespondenceStatuses = {
  created: 'created',
  sent: 'sent',
};

export type CorrespondenceStatus = keyof typeof CorrespondenceStatuses;

export interface Correspondence {
  id: string;
  date: Date;
  sentTo: string;
  type: CorrespondenceType;
  attachments: string[];
  status: CorrespondenceStatus;
}
