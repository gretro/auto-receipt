export type PaymentSource = 'cheque' | 'paypal' | 'import';

export interface Payment {
  amount: number;
  currency: string;
  receiptAmount: number;
  date: Date;
  source: PaymentSource;
  sourceDetails: PaypalPaymentSource | null;
}

export interface PaypalPaymentSource {
  id: string | null;
}
