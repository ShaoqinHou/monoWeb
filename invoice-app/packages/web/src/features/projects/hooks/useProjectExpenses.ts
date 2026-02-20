import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { projectExpenseKeys } from './projectExpenseKeys';
import { projectKeys } from './keys';

export interface ProjectExpense {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  isBillable: boolean;
  isInvoiced: boolean;
  createdAt: string;
}

export interface CreateProjectExpense {
  projectId: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
  isBillable?: boolean;
}

export interface UpdateProjectExpense {
  description?: string;
  amount?: number;
  date?: string;
  category?: string;
  isBillable?: boolean;
  isInvoiced?: boolean;
}

/** Fetch expenses for a project */
export function useProjectExpenses(projectId: string) {
  return useQuery({
    queryKey: projectExpenseKeys.byProject(projectId),
    queryFn: () =>
      apiFetch<ProjectExpense[]>(
        `/project-expenses?projectId=${encodeURIComponent(projectId)}`,
      ),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
}

/** Create a new project expense */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectExpense) =>
      apiPost<ProjectExpense>('/project-expenses', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectExpenseKeys.byProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Expense added');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to add expense'),
  });
}

/** Update an existing project expense */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectExpense }) =>
      apiPut<ProjectExpense>(`/project-expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Expense updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update expense'),
  });
}

/** Delete a project expense */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/project-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      showToast('success', 'Expense deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete expense'),
  });
}
