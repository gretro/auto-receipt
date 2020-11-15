import { DateRange } from '../models/date-range';

export function formatDate(rawDate: Date | string, locale = 'en-US'): string {
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) {
    return '-';
  }

  const dtFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return dtFormatter.format(date);
}

export function formatCurrency(amount: number, currency?: string, locale = 'en-US'): string {
  if (typeof amount !== 'number') {
    return String(amount);
  }

  const formatter = new Intl.NumberFormat(locale, {
    currency: currency || 'USD',
    useGrouping: true,
    style: 'currency',
  });
  return formatter.format(amount);
}

export function formatNumber(value: number, decimal = 2, locale = 'en-US'): string {
  const formatter = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });

  return formatter.format(value);
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
