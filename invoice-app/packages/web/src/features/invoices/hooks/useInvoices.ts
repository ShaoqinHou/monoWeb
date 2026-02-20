import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';
import type { Invoice, InvoiceStatusType } from '../types';
import type { CreateInvoice, UpdateInvoice } from '@xero-replica/shared';

/** Fetch all invoices */
export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: () => apiFetch<Invoice[]>('/invoices'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single invoice by ID */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => apiFetch<Invoice>(`/invoices/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new invoice */
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoice) => apiPost<Invoice>('/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Update an existing invoice */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoice }) =>
      apiPut<Invoice>(`/invoices/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Transition invoice status */
export function useTransitionInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatusType }) =>
      apiPut<Invoice>(`/invoices/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Record a payment against an invoice */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: string; amount: number; date: string; reference?: string }) =>
      apiPost<unknown>('/payments', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
