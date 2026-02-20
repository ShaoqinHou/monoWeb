import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { dashboardKeys } from './keys';
import type { DashboardTasks } from '../types';

export function useDashboardTasks() {
  return useQuery({
    queryKey: dashboardKeys.tasks(),
    queryFn: () => apiFetch<DashboardTasks>('/dashboard/tasks'),
    staleTime: 60 * 1000,
  });
}
