import { Address } from './Address'

export interface ReceiptInfo {
  cultures: string[]
  receipts: string[]
  receiptNumber: string
  receiptDate: Date
  donationDate: Date
  donationAmount: number
  receiptAmount: number
  donationCurrency: string
  isReasonDefined: boolean
  reason: string | null
  fiscalYear: number
  donor: DonorInfo
}

export interface DonorInfo {
  firstName: string
  lastName: string
  address: Address | null
}
