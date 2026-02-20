/** Query key factory for leave requests */
export const leaveRequestKeys = {
  all: ['leave-requests'] as const,
  lists: () => [...leaveRequestKeys.all, 'list'] as const,
  detail: (id: string) => [...leaveRequestKeys.all, 'detail', id] as const,
};
