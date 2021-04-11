import { Address } from '../../../models/address';
import { DateRange } from '../../../models/date-range';
import { Donation, DonationType } from '../../../models/donation';
import { Payment } from '../../../models/payment';
import { GridDonation, ReceiptSentStatus } from '../components/donations-grid/grid-donation.model';

export function mapDonationToGridDonation(donation: Donation): GridDonation {
  return {
    id: donation.id,
    created: getDonationDate(donation),
    source: getPaymentSource(donation.payments)?.sourceName,
    donationType: donation.type,
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
    receiptSentStatus: getReceiptSentStatus(donation),
    search: `${donation.donor.firstName?.toLowerCase()} ${donation.donor.lastName?.toLowerCase()} ${
      donation.donor.email?.toLowerCase() || ''
    }`,
  };
}

export function formatDonationType(donationType: DonationType): string {
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

    case 'directDeposit':
      return {
        sourceName: 'Direct Deposit',
      };

    case 'stocks':
      return {
        sourceName: 'Stocks',
      };

    default:
      return {
        sourceName: 'Unknown',
      };
  }
}

function getReceiptSentStatus(donation: Donation): ReceiptSentStatus {
  if (donation.correspondences.some((corr) => corr.type === 'thank-you')) {
    return 'sent';
  }

  if (donation.documents.length > 0) {
    return donation.donor.email ? 'waiting-to-be-sent' : 'snail-mail';
  }

  return 'no-receipt';
}

function getDonationDate(donation: Donation): Date {
  if (donation.type === 'one-time') {
    return donation.created;
  }

  const paymentDates = donation.payments.map((p) => new Date(p.date));
  return paymentDates.reduce((prevDate, currentDate) => {
    if (isNaN(currentDate.getTime())) {
      return prevDate;
    }

    if (currentDate.getTime() > prevDate.getTime()) {
      return currentDate;
    }

    return prevDate;
  }, new Date(0));
}
