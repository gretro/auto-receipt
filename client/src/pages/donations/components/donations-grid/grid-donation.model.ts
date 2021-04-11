export type ReceiptSentStatus = 'sent' | 'waiting-to-be-sent' | 'snail-mail' | 'no-receipt';
export interface GridDonation {
  id: string;
  created: Date;
  source: string;
  donationType: string;
  donationReason: string;
  donorLastName: string;
  donorFirstName: string;
  donorEmail: string | null;
  donorAddress: string | null;
  donorCountry: string | null;
  donationCurrency: string;
  totalDonationAmount: number;
  totalReceiptAmount: number;
  paymentsCount: number;
  documentsCount: number;
  receiptSentStatus: ReceiptSentStatus;
  correspondencesCount: number;
  search: string;
}
