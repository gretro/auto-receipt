import { Address } from './Address'

export interface Donor {
  firstName: string
  lastName: string
  email?: string
  address: Address
}
