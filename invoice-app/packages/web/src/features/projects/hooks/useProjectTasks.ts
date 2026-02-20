import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { projectTaskKeys } from './projectTaskKeys';
import { projectKeys } from './keys';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  estimatedHours: number | null;
  actualHours: number;
  dueDate: string | null;
  createdAt: string;
}

export interface CreateProjectTask {
  projectId: string;
  name: string;
  description?: string;
  assigneeId?: string;
  estimatedHours?: number;
  dueDate?: string;
}

export interface UpdateProjectTask {
  name?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
}

/** Fetch tasks for a project */
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: projectTaskKeys.byProject(projectId),
    queryFn: () =>
      apiFetch<ProjectTask[]>(
        `/project-tasks?projectId=${encodeURIComponent(projectId)}`,
      ),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
}

/** Create a new project task */
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectTask) =>
      apiPost<ProjectTask>('/project-tasks', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectTaskKeys.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Task created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create task'),
  });
}

/** Update an existing project task */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectTask }) =>
      apiPut<ProjectTask>(`/project-tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Task updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update task'),
  });
}

/** Delete a project task */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/project-tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Task deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete task'),
  });
}
