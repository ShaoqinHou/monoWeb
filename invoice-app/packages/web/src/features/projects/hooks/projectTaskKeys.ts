export const projectTaskKeys = {
  all: ['project-tasks'] as const,
  lists: () => [...projectTaskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...projectTaskKeys.lists(), filters] as const,
  byProject: (projectId: string) => [...projectTaskKeys.all, 'project', projectId] as const,
  details: () => [...projectTaskKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectTaskKeys.details(), id] as const,
};
