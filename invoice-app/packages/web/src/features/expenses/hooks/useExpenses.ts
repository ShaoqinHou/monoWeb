import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { expenseKeys } from './keys';
import type { Expense, CreateExpense, UpdateExpense, ExpenseStatusType } from '@xero-replica/shared';
import { showToast } from '../../dashboard/components/ToastContainer';

/** Fetch all expenses */
export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: () => apiFetch<Expense[]>('/expenses'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single expense by ID */
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => apiFetch<Expense>(`/expenses/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new expense */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpense) => apiPost<Expense>('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', 'Expense created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create expense');
    },
  });
}

/** Update an existing expense */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpense }) =>
      apiPut<Expense>(`/expenses/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', 'Expense updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update expense');
    },
  });
}

/** Delete an expense */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', 'Expense deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete expense');
    },
  });
}

/** Approve a submitted expense */
export function useApproveExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<Expense>(`/expenses/${id}/approve`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', 'Expense approved');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to approve expense');
    },
  });
}

/** Reject a submitted or approved expense */
export function useRejectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<Expense>(`/expenses/${id}/reject`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', 'Expense rejected');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to reject expense');
    },
  });
}

/** Reimburse an approved expense */
export function useReimburseExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<Expense>(`/expenses/${id}/reimburse`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', 'Expense reimbursed');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to reimburse expense');
    },
  });
}

/** Transition expense status (submit, approve, decline, reimburse) */
export function useTransitionExpenseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExpenseStatusType }) =>
      apiPut<Expense>(`/expenses/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      showToast('success', `Expense ${variables.status}`);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update expense status');
    },
  });
}
