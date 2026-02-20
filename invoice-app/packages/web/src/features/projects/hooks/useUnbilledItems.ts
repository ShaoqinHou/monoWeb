import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { projectKeys } from './keys';

export interface UnbilledTimeEntry {
  id: string;
  date: string;
  hours: number;
  hourlyRate: number;
  description: string;
  amount: number;
}

export interface UnbilledExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
}

export interface UnbilledItems {
  timeEntries: UnbilledTimeEntry[];
  expenses: UnbilledExpense[];
  totalUnbilled: number;
}

/** Fetch unbilled time entries and expenses for a project */
export function useUnbilledItems(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), 'unbilled'] as const,
    queryFn: () => apiFetch<UnbilledItems>(`/projects/${projectId}/unbilled`),
    staleTime: 60 * 1000,
    enabled: !!projectId,
  });
}
