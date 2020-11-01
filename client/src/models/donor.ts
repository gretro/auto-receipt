import { Address } from './address';

export interface Donor {
  firstName: string | null;
  lastName: string;
  email: string | null;
  address: Address | null;
}
