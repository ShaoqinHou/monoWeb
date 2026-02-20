export const contactGroupKeys = {
  all: () => ['contactGroups'] as const,
  lists: () => [...contactGroupKeys.all(), 'list'] as const,
  details: () => [...contactGroupKeys.all(), 'detail'] as const,
  detail: (id: string) => [...contactGroupKeys.details(), id] as const,
};
