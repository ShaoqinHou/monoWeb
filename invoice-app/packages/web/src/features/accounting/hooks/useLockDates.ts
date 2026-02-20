import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';

export interface LockDates {
  lockDate: string | null;
  advisorLockDate: string | null;
}

const lockDateKeys = {
  all: ['lock-dates'] as const,
};

export function useLockDates() {
  return useQuery({
    queryKey: lockDateKeys.all,
    queryFn: () => apiFetch<LockDates>('/settings/lock-dates'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateLockDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LockDates) =>
      apiPut<LockDates>('/settings/lock-dates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lockDateKeys.all });
    },
  });
}
