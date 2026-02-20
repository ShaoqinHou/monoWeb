import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { billKeys } from './keys';
import type { Bill } from '../types';

export function useCopyBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (billId: string) => {
      const original = await apiFetch<Bill>(`/bills/${billId}`);
      const copy = await apiPost<Bill>('/bills', {
        contactId: original.contactId,
        reference: original.reference ? `Copy of ${original.reference}` : '',
        amountType: original.amountType,
        currency: original.currency,
        date: new Date().toISOString().slice(0, 10),
        dueDate: '',
        lineItems: original.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          accountCode: li.accountCode ?? '',
          taxRate: li.taxRate ?? 0,
          discount: li.discount ?? 0,
        })),
      });
      return copy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}
