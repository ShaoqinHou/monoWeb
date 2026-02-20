import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { billKeys } from './keys';
import type { BillStatusType } from '../types';

export interface BatchBillStatusRequest {
  billIds: string[];
  targetStatus: BillStatusType;
}

export interface BatchBillStatusResult {
  succeeded: Array<{ id: string; newStatus: BillStatusType }>;
  failed: Array<{ id: string; error: string }>;
}

/** Valid status transitions for bills */
export const BILL_STATUS_TRANSITIONS: Record<BillStatusType, BillStatusType[]> = {
  draft: ['submitted', 'voided'],
  submitted: ['approved', 'draft', 'voided'],
  approved: ['paid', 'voided'],
  paid: [],
  voided: [],
};

/** Get valid target statuses given a set of current statuses */
export function getValidTargetStatuses(currentStatuses: BillStatusType[]): BillStatusType[] {
  if (currentStatuses.length === 0) return [];
  const transitionSets = currentStatuses.map(s => new Set(BILL_STATUS_TRANSITIONS[s] ?? []));
  // Intersection: only statuses valid for ALL selected items
  const first = transitionSets[0];
  return [...first].filter(status =>
    transitionSets.every(set => set.has(status))
  );
}

/** Batch change status for multiple bills */
export function useBatchBillStatusChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BatchBillStatusRequest) =>
      apiPost<BatchBillStatusResult>('/bills/batch-status-change', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}
