import { CURRENCY_SYMBOLS, CURRENCY_DECIMALS } from '../constants';

/**
 * Format a number as currency string.
 * formatCurrency(1234.5, 'NZD') → "$1,234.50"
 * formatCurrency(-500, 'NZD') → "-$500.00"
 */
export function formatCurrency(amount: number, currency: string = 'NZD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
  const decimals = CURRENCY_DECIMALS[currency] ?? CURRENCY_DECIMALS.DEFAULT;
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-NZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Parse a currency string back to number.
 * parseCurrency("$1,234.50") → 1234.5
 * parseCurrency("-$500.00") → -500
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
