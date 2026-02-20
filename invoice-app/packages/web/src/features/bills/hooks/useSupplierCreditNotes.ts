import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';
import { billKeys } from './keys';
import { showToast } from '../../dashboard/components/ToastContainer';

export interface SupplierCreditNote {
  id: string;
  creditNoteNumber: string;
  type: 'purchase';
  contactId: string;
  contactName: string;
  linkedBillId: string | null;
  status: string;
  date: string;
  subTotal: number;
  totalTax: number;
  total: number;
  remainingCredit: number;
  createdAt: string;
}

interface CreateSupplierCreditNoteData {
  contactId: string;
  date: string;
  reference?: string;
  subTotal: number;
  totalTax: number;
  total: number;
}

const supplierCreditNoteKeys = {
  all: ['supplier-credit-notes'] as const,
  lists: () => [...supplierCreditNoteKeys.all, 'list'] as const,
  detail: (id: string) => [...supplierCreditNoteKeys.all, 'detail', id] as const,
};

export function useSupplierCreditNotes() {
  return useQuery({
    queryKey: supplierCreditNoteKeys.lists(),
    queryFn: async () => {
      const all = await apiFetch<SupplierCreditNote[]>('/credit-notes');
      return all.filter((cn) => cn.type === 'purchase');
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSupplierCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierCreditNoteData) =>
      apiPost<SupplierCreditNote>('/credit-notes', {
        type: 'purchase',
        contactId: data.contactId,
        date: data.date,
        subTotal: data.subTotal,
        totalTax: data.totalTax,
        total: data.total,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierCreditNoteKeys.lists() });
      showToast('success', 'Credit note created');
    },
    onError: (err: Error) => {
      showToast('error', err.message);
    },
  });
}
