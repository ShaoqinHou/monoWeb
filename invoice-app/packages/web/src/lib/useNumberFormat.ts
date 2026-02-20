type Locale = 'NZ' | 'US' | 'UK';

interface NumberFormatter {
  formatCurrency: (n: number) => string;
  formatNumber: (n: number) => string;
}

const LOCALE_MAP: Record<Locale, { intl: string; currency: string }> = {
  NZ: { intl: 'en-NZ', currency: 'NZD' },
  US: { intl: 'en-US', currency: 'USD' },
  UK: { intl: 'en-GB', currency: 'GBP' },
};

export function useNumberFormat(locale: Locale = 'NZ'): NumberFormatter {
  const config = LOCALE_MAP[locale];

  return {
    formatCurrency(n: number): string {
      return new Intl.NumberFormat(config.intl, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
    },
    formatNumber(n: number): string {
      return new Intl.NumberFormat(config.intl, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n);
    },
  };
}
