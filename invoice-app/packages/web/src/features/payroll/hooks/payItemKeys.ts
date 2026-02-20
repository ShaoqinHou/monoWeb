/** Query key factory for pay items */
export const payItemKeys = {
  all: ['pay-items'] as const,
  lists: () => [...payItemKeys.all, 'list'] as const,
  detail: (id: string) => [...payItemKeys.all, 'detail', id] as const,
};
