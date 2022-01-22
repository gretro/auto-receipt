import { DonationType } from '../models/donation';
import { Donor } from '../models/donor';
import { PaymentSource } from '../models/payment';

export interface CreateDonationDTO {
  donationType: DonationType;
  emailReceipt: boolean;
  source: PaymentSource;
  currency: string;
  amount: number;
  receiptAmount: number;
  paymentDate: Date | string;
  reason?: string;
  donor: Donor;
}
