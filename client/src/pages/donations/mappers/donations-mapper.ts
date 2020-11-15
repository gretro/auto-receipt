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

export function mapDonorAddressMultiLine(donorAddress: Address | undefined | null, emptyString = '-'): string[] {
  if (!donorAddress) {
    return [emptyString];
  }

  const linesAndParts = [
    [donorAddress.line1],
    [donorAddress.line2],
    [donorAddress.city, ',', donorAddress.state],
    [donorAddress.postalCode, ',', donorAddress.country],
  ];

  return linesAndParts.map((lineParts) => {
    return lineParts
      .filter((part) => !!part)
      .join(' ')
      .replace(' ,', ',');
  });
}

export function getDonationCurrency(payments: Payment[], defaultCurrency = '-'): string {
  if (payments.length === 0) {
    return defaultCurrency;
  }

  return payments[0].currency;
}

export function calculateDonationTotalAmount(payments: Payment[], selector: (payment: Payment) => number): number {
  return payments.reduce((acc, payment) => {
    return acc + selector(payment);
  }, 0);
}

export interface DateRange {
  start: Date;
  end?: Date;
}

export function getPaymentDateRange(payments: Payment[]): DateRange | null {
  if (payments.length === 0) {
    return null;
  }

  if (payments.length === 1) {
    return {
      start: new Date(payments[0].date),
    };
  }

  const dateRange = payments.reduce(
    (acc, payment) => {
      const paymentDate = new Date(payment.date);

      if (paymentDate.getTime() < acc.start.getTime()) {
        acc.start = paymentDate;
      }

      if (paymentDate.getTime() > acc.end.getTime()) {
        acc.end = paymentDate;
      }

      return acc;
    },
    { start: new Date(), end: new Date(0) },
  );

  return dateRange;
}

export function formatDateRange(dateRange: DateRange | null, locale = 'en-US'): string {
  if (!dateRange) {
    return '-';
  }

  if (!dateRange.end) {
    const fullDateFormatter = new Intl.DateTimeFormat(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return fullDateFormatter.format(dateRange.start);
  }

  const monthDateFormatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  });

  return `${monthDateFormatter.format(dateRange.start)} - ${monthDateFormatter.format(dateRange.end)}`;
}

export interface PaymentSourceLink {
  sourceName: string;
  link?: string;
}

export function getPaymentSource(payments: Payment[]): PaymentSourceLink {
  if (payments.length === 0) {
    return { sourceName: '-' };
  }

  const sameSource = payments.every((payment) => payment.source === payments[0].source);
  if (sameSource) {
    return formatPayment(payments[payments.length - 1]);
  }

  return {
    sourceName: 'Multiple sources',
  };
}

function formatPayment(payment: Payment): PaymentSourceLink {
  switch (payment.source) {
    case 'cheque':
      return {
        sourceName: 'Cheque',
      };

    case 'paypal':
      return {
        sourceName: 'PayPal',
        link: payment.sourceDetails ? `https://www.paypal.com/activity/payment/${payment.sourceDetails.id}` : undefined,
      };

    case 'import':
      return {
        sourceName: 'Bulk import',
      };

    default:
      return {
        sourceName: 'Unknown',
      };
  }
}
