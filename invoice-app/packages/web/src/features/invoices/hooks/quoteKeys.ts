export const quoteKeys = {
  all: () => ['quotes'] as const,
  lists: () => [...quoteKeys.all(), 'list'] as const,
  details: () => [...quoteKeys.all(), 'detail'] as const,
  detail: (id: string) => [...quoteKeys.details(), id] as const,
};
