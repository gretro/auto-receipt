import { Address } from '../../../models/address';
import { Donation, DonationType } from '../../../models/donation';
import { Payment } from '../../../models/payment';
import { GridDonation } from '../components/donations-grid/grid-donation.model';

export function mapDonationToGridDonation(donation: Donation): GridDonation {
  return {
    id: donation.id,
    created: donation.created,
    donationType: mapDonationType(donation.type),
    donationReason: donation.reason || '-',
    donorLastName: donation.donor.lastName,
    donorFirstName: donation.donor.firstName || '-',
    donorEmail: donation.donor.email,
    donorAddress: mapDonorAddress(donation.donor.address),
    donorCountry: donation.donor.address?.country || '-',
    donationCurrency: getDonationCurrency(donation.payments),
    totalDonationAmount: calculateDonationTotalAmount(donation.payments, (p) => p.amount),
    totalReceiptAmount: calculateDonationTotalAmount(donation.payments, (p) => p.receiptAmount),
    paymentsCount: donation.payments.length,
    documentsCount: donation.documents.length,
    correspondencesCount: donation.correspondences.length,
  };
}

export function mapDonationType(donationType: DonationType): string {
  switch (donationType) {
    case 'one-time':
      return 'One Time';

    case 'recurrent':
      return 'Recurrent';

    default:
      return '-';
  }
}

export function mapDonorAddress(donorAddress: Address | undefined | null, emptyString = '-'): string {
  if (!donorAddress) {
    return emptyString;
  }

  const parts = [
    donorAddress.line1,
    donorAddress.line2,
    ',',
    donorAddress.city,
    donorAddress.state,
    donorAddress.postalCode,
  ];

  return parts
    .filter((part) => !!part)
    .join(' ')
    .replace(' ,', ',');
}

export function getDonationCurrency(payments: Payment[]): string {
  if (payments.length === 0) {
    return '-';
  }

  return payments[0].currency;
}

export function calculateDonationTotalAmount(payments: Payment[], selector: (payment: Payment) => number): number {
  return payments.reduce((acc, payment) => {
    return acc + selector(payment);
  }, 0);
}
