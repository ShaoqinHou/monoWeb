export const purchaseOrderKeys = {
  all: () => ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all(), 'list'] as const,
  details: () => [...purchaseOrderKeys.all(), 'detail'] as const,
  detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
};
