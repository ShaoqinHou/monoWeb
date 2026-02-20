export const projectExpenseKeys = {
  all: ['project-expenses'] as const,
  lists: () => [...projectExpenseKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...projectExpenseKeys.lists(), filters] as const,
  byProject: (projectId: string) => [...projectExpenseKeys.all, 'project', projectId] as const,
  details: () => [...projectExpenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectExpenseKeys.details(), id] as const,
};
