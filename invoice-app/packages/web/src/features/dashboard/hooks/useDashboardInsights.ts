import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { dashboardKeys } from './keys';
import type { DashboardInsights } from '../types';

export function useDashboardInsights() {
  return useQuery({
    queryKey: dashboardKeys.insights(),
    queryFn: () => apiFetch<DashboardInsights>('/dashboard/insights'),
    staleTime: 60 * 1000,
  });
}
