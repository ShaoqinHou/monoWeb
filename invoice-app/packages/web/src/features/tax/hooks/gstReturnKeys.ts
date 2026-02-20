export const gstReturnKeys = {
  all: ['gst-returns'] as const,
  lists: () => [...gstReturnKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...gstReturnKeys.lists(), filters] as const,
  details: () => [...gstReturnKeys.all, 'detail'] as const,
  detail: (id: string) => [...gstReturnKeys.details(), id] as const,
};
