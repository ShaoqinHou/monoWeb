import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';
import { creditNoteKeys } from './creditNoteKeys';

export type CreditNoteType = 'sales' | 'purchase';
export type CreditNoteStatus = 'draft' | 'submitted' | 'approved' | 'applied' | 'voided';

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  type: CreditNoteType;
  contactId: string;
  contactName: string;
  linkedInvoiceId: string | null;
  linkedBillId: string | null;
  status: CreditNoteStatus;
  date: string;
  subTotal: number;
  totalTax: number;
  total: number;
  remainingCredit: number;
  createdAt: string;
}

export interface CreateCreditNote {
  type: CreditNoteType;
  contactId: string;
  date: string;
  subTotal?: number;
  totalTax?: number;
  total?: number;
  linkedInvoiceId?: string;
  linkedBillId?: string;
}

export interface ApplyCreditNote {
  invoiceId?: string;
  billId?: string;
  amount: number;
}

/** Fetch all credit notes */
export function useCreditNotes() {
  return useQuery({
    queryKey: creditNoteKeys.lists(),
    queryFn: () => apiFetch<CreditNote[]>('/credit-notes'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single credit note */
export function useCreditNote(id: string) {
  return useQuery({
    queryKey: creditNoteKeys.detail(id),
    queryFn: () => apiFetch<CreditNote>(`/credit-notes/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new credit note */
export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCreditNote) => apiPost<CreditNote>('/credit-notes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.lists() });
    },
  });
}

/** Transition credit note status */
export function useTransitionCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CreditNoteStatus }) =>
      apiPut<CreditNote>(`/credit-notes/${id}/status`, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.lists() });
    },
  });
}

/** Apply credit note to an invoice or bill */
export function useApplyCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApplyCreditNote }) =>
      apiPost<CreditNote>(`/credit-notes/${id}/apply`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.lists() });
    },
  });
}
