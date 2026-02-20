export const DEFAULT_CURRENCY = 'NZD';
export const DEFAULT_TAX_RATE = 15; // NZ GST
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NZD: '$',
  AUD: '$',
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
};

export const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0,
  DEFAULT: 2,
};

export const INVOICE_NUMBER_PREFIX = 'INV-';
export const BILL_NUMBER_PREFIX = 'BILL-';

export const MAX_LINE_ITEMS = 100;

export const DUE_DATE_OPTIONS = [
  { label: 'Due on receipt', days: 0 },
  { label: 'Due in 7 days', days: 7 },
  { label: 'Due in 14 days', days: 14 },
  { label: 'Due in 30 days', days: 30 },
  { label: 'Due in 60 days', days: 60 },
  { label: 'Due in 90 days', days: 90 },
] as const;
