export const recurringInvoiceKeys = {
  all: () => ['recurring-invoices'] as const,
  lists: () => [...recurringInvoiceKeys.all(), 'list'] as const,
  details: () => [...recurringInvoiceKeys.all(), 'detail'] as const,
  detail: (id: string) => [...recurringInvoiceKeys.details(), id] as const,
};
