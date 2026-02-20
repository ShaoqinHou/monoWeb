/** Query key factory for leave types */
export const leaveTypeKeys = {
  all: ['leave-types'] as const,
  list: () => [...leaveTypeKeys.all, 'list'] as const,
  detail: (id: string) => [...leaveTypeKeys.all, 'detail', id] as const,
};
