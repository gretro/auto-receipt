import { Address } from '../../../../../../models/address';

export interface DonorEdit {
  firstName?: string;
  lastName?: string;
  email?: string;
  address: Partial<Address>;
  generateReceipt: boolean;
}
