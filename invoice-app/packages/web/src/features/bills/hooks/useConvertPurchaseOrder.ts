import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { purchaseOrderKeys } from './purchaseOrderKeys';
import { billKeys } from './keys';

interface ConvertedBill {
  id: string;
  billNumber: string;
  sourcePurchaseOrderId: string;
  contactId: string;
  contactName: string;
  total: number;
  status: string;
}

/** Convert an approved purchase order to a bill with lineage tracking (sourcePurchaseOrderId) */
export function useConvertPurchaseOrderToBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) =>
      apiPost<ConvertedBill>(`/purchase-orders/${poId}/convert`, {}),
    onSuccess: (_data, poId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(poId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}
