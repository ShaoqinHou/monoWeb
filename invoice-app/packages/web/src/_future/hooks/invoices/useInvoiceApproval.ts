import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';

export type ApprovalAction = 'submitted' | 'approved' | 'rejected';

export interface ApprovalHistoryEntry {
  id: string;
  invoiceId: string;
  action: ApprovalAction;
  userId: string;
  userName: string;
  notes: string | null;
  timestamp: string;
}

export type InvoiceApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

/** Submit an invoice for approval */
export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      apiPost<{ status: InvoiceApprovalStatus }>(`/invoices/${invoiceId}/submit-for-approval`, {}),
    onSuccess: (_data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Approve an invoice */
export function useApproveInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, notes }: { invoiceId: string; notes?: string }) =>
      apiPost<{ status: InvoiceApprovalStatus }>(`/invoices/${invoiceId}/approve`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Reject an invoice */
export function useRejectInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason: string }) =>
      apiPost<{ status: InvoiceApprovalStatus }>(`/invoices/${invoiceId}/reject`, { reason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Fetch approval history for an invoice */
export function useApprovalHistory(invoiceId: string) {
  return useQuery({
    queryKey: [...invoiceKeys.detail(invoiceId), 'approval-history'] as const,
    queryFn: () => apiFetch<ApprovalHistoryEntry[]>(`/invoices/${invoiceId}/approval-history`),
    staleTime: 60 * 1000,
    enabled: !!invoiceId,
  });
}
