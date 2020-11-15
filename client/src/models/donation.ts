import { Correspondence } from './correspondence';
import { DocumentMetadata } from './document-metadata';
import { Donor } from './donor';
import { Payment } from './payment';

export type DonationType = 'one-time' | 'recurrent';

export interface Donation {
  id: string;
  externalId: string | null;
  created: Date;
  fiscalYear: number;
  type: DonationType;
  donor: Donor;
  payments: Payment[];
  emailReceipt: boolean;
  documentIds: string[];
  documents: DocumentMetadata[];
  correspondences: Correspondence[];
  reason: string | null;
}
