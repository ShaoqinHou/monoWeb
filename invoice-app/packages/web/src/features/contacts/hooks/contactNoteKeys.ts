export const contactNoteKeys = {
  all: () => ['contactNotes'] as const,
  lists: () => [...contactNoteKeys.all(), 'list'] as const,
  list: (contactId: string) => [...contactNoteKeys.lists(), contactId] as const,
};
