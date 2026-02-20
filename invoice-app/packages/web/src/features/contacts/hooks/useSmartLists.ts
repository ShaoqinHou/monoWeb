import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export type SmartListOperator = 'equals' | 'contains' | 'greaterThan' | 'lessThan';

export type SmartListField =
  | 'contactType'
  | 'name'
  | 'email'
  | 'city'
  | 'outstandingBalance'
  | 'overdueBalance'
  | 'lastActivityDate'
  | 'isArchived';

export interface SmartListFilter {
  field: SmartListField;
  operator: SmartListOperator;
  value: string;
}

export interface SmartList {
  id: string;
  name: string;
  filters: SmartListFilter[];
  createdAt: string;
}

const smartListKeys = {
  all: ['smart-lists'] as const,
  lists: () => [...smartListKeys.all, 'list'] as const,
};

export function useSmartLists() {
  return useQuery({
    queryKey: smartListKeys.lists(),
    queryFn: () => apiFetch<SmartList[]>('/smart-lists'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveSmartList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; filters: SmartListFilter[] }) =>
      apiPost<SmartList>('/smart-lists', { name: input.name, filters: JSON.stringify(input.filters) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartListKeys.lists() });
      showToast('success', 'Smart list saved');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to save smart list');
    },
  });
}

export function useDeleteSmartList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/smart-lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartListKeys.lists() });
      showToast('success', 'Smart list deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete smart list');
    },
  });
}
