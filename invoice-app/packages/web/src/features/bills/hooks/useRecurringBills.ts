import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { recurringBillKeys } from './recurringBillKeys';
import { showToast } from '../../dashboard/components/ToastContainer';

export type RecurringBillFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
export type RecurringBillStatus = 'active' | 'paused' | 'completed';

export interface RecurringBill {
  id: string;
  templateName: string;
  contactId: string;
  contactName: string;
  frequency: RecurringBillFrequency;
  nextDate: string;
  endDate: string | null;
  daysUntilDue: number;
  status: RecurringBillStatus;
  subTotal: number;
  totalTax: number;
  total: number;
  timesGenerated: number;
  createdAt: string;
}

export interface CreateRecurringBill {
  templateName: string;
  contactId: string;
  frequency: RecurringBillFrequency;
  nextDate: string;
  endDate?: string;
  daysUntilDue?: number;
  subTotal?: number;
  totalTax?: number;
  total?: number;
}

export interface UpdateRecurringBill {
  templateName?: string;
  contactId?: string;
  frequency?: RecurringBillFrequency;
  nextDate?: string;
  endDate?: string;
  daysUntilDue?: number;
  status?: RecurringBillStatus;
  subTotal?: number;
  totalTax?: number;
  total?: number;
}

/** Fetch all recurring bills */
export function useRecurringBills() {
  return useQuery({
    queryKey: recurringBillKeys.lists(),
    queryFn: () => apiFetch<RecurringBill[]>('/recurring-bills'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single recurring bill */
export function useRecurringBill(id: string) {
  return useQuery({
    queryKey: recurringBillKeys.detail(id),
    queryFn: () => apiFetch<RecurringBill>(`/recurring-bills/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new recurring bill */
export function useCreateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringBill) => apiPost<RecurringBill>('/recurring-bills', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      showToast('success', 'Recurring bill created');
    },
    onError: (err: Error) => {
      showToast('error', err.message);
    },
  });
}

/** Update a recurring bill */
export function useUpdateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringBill }) =>
      apiPut<RecurringBill>(`/recurring-bills/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      showToast('success', 'Recurring bill updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message);
    },
  });
}

/** Delete a recurring bill */
export function useDeleteRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/recurring-bills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      showToast('success', 'Recurring bill deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message);
    },
  });
}

/** Generate a bill from a recurring template */
export function useGenerateRecurringBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<unknown>(`/recurring-bills/${id}/generate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringBillKeys.lists() });
      showToast('success', 'Bill generated from recurring bill');
    },
    onError: (err: Error) => {
      showToast('error', err.message);
    },
  });
}
