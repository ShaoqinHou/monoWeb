import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';

export interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  contactName: string;
  total: number;
  amountDue: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  lastReminderSent?: string;
}

export type OverdueFilter = 'all' | '1-30' | '31-60' | '60+';

function computeDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function filterByRange(invoices: OverdueInvoice[], filter: OverdueFilter): OverdueInvoice[] {
  if (filter === 'all') return invoices;
  return invoices.filter((inv) => {
    if (filter === '1-30') return inv.daysOverdue >= 1 && inv.daysOverdue <= 30;
    if (filter === '31-60') return inv.daysOverdue >= 31 && inv.daysOverdue <= 60;
    return inv.daysOverdue > 60;
  });
}

export function useOverdueInvoices(filter: OverdueFilter = 'all') {
  return useQuery({
    queryKey: ['invoices', 'overdue', filter],
    queryFn: async () => {
      const filterParam = filter !== 'all' ? `?filter=${filter}` : '';
      return apiFetch<OverdueInvoice[]>(`/invoices/overdue${filterParam}`);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiPost<{ success: boolean; invoiceId: string; sentAt: string }>(
        `/invoices/${invoiceId}/send-reminder`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'overdue'] });
    },
  });
}

export function useSendBulkReminders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const results = [];
      for (const id of invoiceIds) {
        const result = await apiPost<{ success: boolean; invoiceId: string; sentAt: string }>(
          `/invoices/${id}/send-reminder`,
          {},
        );
        results.push(result);
      }
      return {
        success: true,
        sent: invoiceIds.length,
        sentAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'overdue'] });
    },
  });
}

export { computeDaysOverdue, filterByRange };
