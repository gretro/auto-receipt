import { Donor } from './Donor'
import { Payment } from './Payment'

// TODO: We may need an additional field to easily retrieve a Donation for recurring payments...
export interface Donation {
  id: string
  created: Date
  fiscalYear: number
  type: 'one-time' | 'recurrent'
  donor: Donor
  payments: Payment[]
}
