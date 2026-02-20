import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { recurringBillKeys } from './recurringBillKeys';

export interface RecurringBillScheduleInfo {
  recurringBillId: string;
  nextDate: string;
  frequency: string;
  supplierName: string;
  lastGeneratedDate: string | null;
  timesGenerated: number;
  status: 'active' | 'paused' | 'completed';
}

export interface GeneratedBill {
  id: string;
  billNumber: string;
  date: string;
  total: number;
}

/** Fetch schedule info for a recurring bill */
export function useRecurringBillSchedule(recurringBillId: string) {
  return useQuery({
    queryKey: [...recurringBillKeys.detail(recurringBillId), 'schedule'] as const,
    queryFn: () => apiFetch<RecurringBillScheduleInfo>(`/recurring-bills/${recurringBillId}/schedule`),
    staleTime: 60 * 1000,
    enabled: !!recurringBillId,
  });
}

/** Generate a new bill from a recurring template */
export function useGenerateFromRecurringBill(recurringBillId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<GeneratedBill>(`/recurring-bills/${recurringBillId}/generate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.detail(recurringBillId) });
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
    },
  });
}
