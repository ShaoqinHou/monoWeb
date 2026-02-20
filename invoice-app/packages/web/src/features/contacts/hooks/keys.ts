export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters: Record<string, string>) => [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
  activity: (id: string) => [...contactKeys.all, 'activity', id] as const,
  invoices: (contactId: string) => [...contactKeys.all, 'invoices', contactId] as const,
  bills: (contactId: string) => [...contactKeys.all, 'bills', contactId] as const,
};
