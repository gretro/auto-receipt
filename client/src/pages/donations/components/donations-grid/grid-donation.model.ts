export interface GridDonation {
  id: string;
  created: Date;
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
  receiptSent: boolean;
  correspondencesCount: number;
  search: string;
}
