export const taxKeys = {
  all: ['tax'] as const,
  gstReturns: () => [...taxKeys.all, 'gst-returns'] as const,
  gstReturn: (id: string) => [...taxKeys.all, 'gst-return', id] as const,
  taxRates: () => [...taxKeys.all, 'tax-rates'] as const,
  taxSummary: () => [...taxKeys.all, 'summary'] as const,
};
