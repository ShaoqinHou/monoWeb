import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { recurringInvoiceKeys } from './recurringInvoiceKeys';
import { invoiceKeys } from './keys';

export interface RecurringScheduleInfo {
  recurringId: string;
  nextDate: string;
  frequency: string;
  lastGeneratedDate: string | null;
  timesGenerated: number;
  status: 'active' | 'paused' | 'completed';
}

export interface GeneratedInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  total: number;
}

/** Fetch schedule info for a recurring invoice */
export function useRecurringSchedule(recurringId: string) {
  return useQuery({
    queryKey: [...recurringInvoiceKeys.detail(recurringId), 'schedule'] as const,
    queryFn: () => apiFetch<RecurringScheduleInfo>(`/recurring-invoices/${recurringId}/schedule`),
    staleTime: 60 * 1000,
    enabled: !!recurringId,
  });
}

/** Generate a new invoice from a recurring template */
export function useGenerateFromRecurring(recurringId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<GeneratedInvoice>(`/recurring-invoices/${recurringId}/generate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.detail(recurringId) });
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
