import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { projectKeys } from './keys';

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  actual: number;
  variance: number;
  percentUsed: number;
}

export interface ProjectBudgetData {
  categories: BudgetCategory[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  totalPercentUsed: number;
}

export function useProjectBudget(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), 'budget'] as const,
    queryFn: () => apiFetch<ProjectBudgetData>(`/projects/${projectId}/budget`),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
}

export function useUpdateProjectBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, categories }: { projectId: string; categories: BudgetCategory[] }) => {
      return apiPut<ProjectBudgetData>(`/projects/${projectId}/budget`, { categories });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...projectKeys.detail(variables.projectId), 'budget'],
      });
      showToast('success', 'Budget updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update budget'),
  });
}
