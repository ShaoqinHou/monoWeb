type Locale = 'NZ' | 'US' | 'UK';

interface DateFormatter {
  format: (date: Date | string) => string;
}

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(date: Date, locale: Locale): string {
  const d = padTwo(date.getDate());
  const m = padTwo(date.getMonth() + 1);
  const y = date.getFullYear();

  switch (locale) {
    case 'US':
      return `${m}/${d}/${y}`;
    case 'NZ':
    case 'UK':
    default:
      return `${d}/${m}/${y}`;
  }
}

export function useDateFormat(locale: Locale = 'NZ'): DateFormatter {
  return {
    format(date: Date | string): string {
      const d = typeof date === 'string' ? new Date(date) : date;
      return formatDate(d, locale);
    },
  };
}
