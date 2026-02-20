import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { projectKeys } from './keys';

export interface MonthlyBreakdown {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProjectProfitabilityData {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  margin: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export function useProjectProfitability(projectId: string) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId), 'profitability'] as const,
    queryFn: () => apiFetch<ProjectProfitabilityData>(`/projects/${projectId}/profitability`),
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });
}
