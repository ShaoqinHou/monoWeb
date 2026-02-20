import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { billKeys } from './keys';
import type { Bill, BillStatusType, CreateBill, BillPayment, RecordPaymentData } from '../types';
import type { Contact } from '@shared/schemas/contact';

// --- Hooks ---

export function useBills() {
  return useQuery({
    queryKey: billKeys.lists(),
    queryFn: () => apiFetch<Bill[]>('/bills'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: billKeys.detail(id),
    queryFn: () => apiFetch<Bill>(`/bills/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBill) => apiPost<Bill>('/bills', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBill> }) =>
      apiPut<Bill>(`/bills/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useUpdateBillStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BillStatusType }) =>
      apiPut<Bill>(`/bills/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/bills/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useBulkDeleteBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => apiDelete<void>(`/bills/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useBulkApproveBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => apiPut<Bill>(`/bills/${id}/status`, { status: 'approved' })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

// --- Payment hooks ---

export function useBillPayments(billId: string) {
  return useQuery({
    queryKey: billKeys.payments(billId),
    queryFn: () => apiFetch<BillPayment[]>(`/payments?billId=${billId}`),
    staleTime: 60 * 1000,
    enabled: !!billId,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentData) =>
      apiPost<BillPayment>('/payments', {
        billId: data.billId,
        amount: data.amount,
        date: data.date,
        reference: data.reference,
        bankAccount: data.bankAccount,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: billKeys.detail(variables.billId) });
      queryClient.invalidateQueries({ queryKey: billKeys.payments(variables.billId) });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const contacts = await apiFetch<Contact[]>('/contacts');
      return contacts
        .filter((c) => c.type === 'supplier' || c.type === 'customer_and_supplier')
        .map((c) => ({ id: c.id, name: c.name }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
