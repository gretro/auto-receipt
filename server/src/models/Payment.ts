import { PaypalPaymentSource } from './PaypalPaymentSource'
import { SquarePaymentSource } from './SquarePaymentSource'

export interface Payment {
  amount: number
  currency: string
  receiptAmount: number
  date: Date
  source: 'cheque' | 'paypal' | 'square`'
  sourceDetails?: PaypalPaymentSource | SquarePaymentSource
}
