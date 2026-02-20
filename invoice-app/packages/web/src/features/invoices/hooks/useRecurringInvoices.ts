import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { recurringInvoiceKeys } from './recurringInvoiceKeys';

export type RecurringFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
export type RecurringStatus = 'active' | 'paused' | 'completed';

export interface RecurringInvoice {
  id: string;
  templateName: string;
  contactId: string;
  contactName: string;
  frequency: RecurringFrequency;
  nextDate: string;
  endDate: string | null;
  daysUntilDue: number;
  status: RecurringStatus;
  subTotal: number;
  totalTax: number;
  total: number;
  timesGenerated: number;
  createdAt: string;
}

export interface CreateRecurringInvoice {
  templateName: string;
  contactId: string;
  frequency: RecurringFrequency;
  nextDate: string;
  endDate?: string;
  daysUntilDue?: number;
  subTotal?: number;
  totalTax?: number;
  total?: number;
}

export interface UpdateRecurringInvoice {
  templateName?: string;
  contactId?: string;
  frequency?: RecurringFrequency;
  nextDate?: string;
  endDate?: string;
  daysUntilDue?: number;
  status?: RecurringStatus;
  subTotal?: number;
  totalTax?: number;
  total?: number;
}

/** Fetch all recurring invoices */
export function useRecurringInvoices() {
  return useQuery({
    queryKey: recurringInvoiceKeys.lists(),
    queryFn: () => apiFetch<RecurringInvoice[]>('/recurring-invoices'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single recurring invoice */
export function useRecurringInvoice(id: string) {
  return useQuery({
    queryKey: recurringInvoiceKeys.detail(id),
    queryFn: () => apiFetch<RecurringInvoice>(`/recurring-invoices/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new recurring invoice */
export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringInvoice) => apiPost<RecurringInvoice>('/recurring-invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}

/** Update a recurring invoice */
export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringInvoice }) =>
      apiPut<RecurringInvoice>(`/recurring-invoices/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}

/** Delete a recurring invoice */
export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/recurring-invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}

/** Generate an invoice from a recurring template */
export function useGenerateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<unknown>(`/recurring-invoices/${id}/generate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
    },
  });
}
