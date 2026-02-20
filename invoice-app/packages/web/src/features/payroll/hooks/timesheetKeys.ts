export const timesheetKeys = {
  all: ['timesheets'] as const,
  lists: () => [...timesheetKeys.all, 'list'] as const,
  week: (weekStart: string) => [...timesheetKeys.lists(), weekStart] as const,
  detail: (id: string) => [...timesheetKeys.all, 'detail', id] as const,
};
