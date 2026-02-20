import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { payItemKeys } from './payItemKeys';

// ── Types ────────────────────────────────────────────────────────────────────

export type PayItemType = 'earnings' | 'deduction' | 'reimbursement' | 'tax';
export type PayItemRateType = 'fixed' | 'per_hour' | 'percentage';

export interface PayItem {
  id: string;
  name: string;
  type: PayItemType;
  rateType: PayItemRateType;
  amount: number;
  accountCode: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePayItemInput {
  name: string;
  type: PayItemType;
  rateType?: PayItemRateType;
  amount?: number;
  accountCode?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdatePayItemInput {
  name?: string;
  type?: PayItemType;
  rateType?: PayItemRateType;
  amount?: number;
  accountCode?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetch all pay items */
export function usePayItems() {
  return useQuery({
    queryKey: payItemKeys.lists(),
    queryFn: () => apiFetch<PayItem[]>('/pay-items'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single pay item by ID */
export function usePayItem(id: string) {
  return useQuery({
    queryKey: payItemKeys.detail(id),
    queryFn: () => apiFetch<PayItem>(`/pay-items/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────────────────────

/** Create a pay item */
export function useCreatePayItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePayItemInput) =>
      apiPost<PayItem>('/pay-items', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payItemKeys.lists() });
      showToast('success', 'Pay item added');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to add pay item'),
  });
}

/** Update a pay item */
export function useUpdatePayItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePayItemInput }) =>
      apiPut<PayItem>(`/pay-items/${id}`, updates),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: payItemKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: payItemKeys.lists() });
      showToast('success', 'Pay item updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update pay item'),
  });
}

/** Delete a pay item */
export function useDeletePayItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/pay-items/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payItemKeys.lists() });
      showToast('success', 'Pay item deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete pay item'),
  });
}
