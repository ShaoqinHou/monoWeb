import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { billKeys } from './keys';

export type BillApprovalAction = 'submitted' | 'approved' | 'rejected';

export interface BillApprovalHistoryEntry {
  id: string;
  billId: string;
  action: BillApprovalAction;
  userId: string;
  userName: string;
  notes: string | null;
  timestamp: string;
}

export type BillApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

/** Submit a bill for approval */
export function useSubmitBillForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (billId: string) =>
      apiPost<{ status: BillApprovalStatus }>(`/bills/${billId}/submit-for-approval`, {}),
    onSuccess: (_data, billId) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(billId) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

/** Approve a bill */
export function useApproveBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, notes }: { billId: string; notes?: string }) =>
      apiPost<{ status: BillApprovalStatus }>(`/bills/${billId}/approve`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(variables.billId) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

/** Reject a bill */
export function useRejectBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, reason }: { billId: string; reason: string }) =>
      apiPost<{ status: BillApprovalStatus }>(`/bills/${billId}/reject`, { reason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(variables.billId) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

/** Fetch approval history for a bill */
export function useBillApprovalHistory(billId: string) {
  return useQuery({
    queryKey: [...billKeys.detail(billId), 'approval-history'] as const,
    queryFn: () => apiFetch<BillApprovalHistoryEntry[]>(`/bills/${billId}/approval-history`),
    staleTime: 60 * 1000,
    enabled: !!billId,
  });
}
