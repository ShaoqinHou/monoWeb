export const recurringBillKeys = {
  all: () => ['recurring-bills'] as const,
  lists: () => [...recurringBillKeys.all(), 'list'] as const,
  details: () => [...recurringBillKeys.all(), 'detail'] as const,
  detail: (id: string) => [...recurringBillKeys.details(), id] as const,
};
