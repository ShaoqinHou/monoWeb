export const creditNoteKeys = {
  all: () => ['credit-notes'] as const,
  lists: () => [...creditNoteKeys.all(), 'list'] as const,
  details: () => [...creditNoteKeys.all(), 'detail'] as const,
  detail: (id: string) => [...creditNoteKeys.details(), id] as const,
};
