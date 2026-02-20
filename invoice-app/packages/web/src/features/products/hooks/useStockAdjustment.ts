import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiFetch } from '../../../lib/api-helpers';
import { productKeys } from './keys';
import type { Product, StockAdjustment, StockMovement } from '@xero-replica/shared';

/** Adjust stock for a product via POST /products/:id/adjust */
export function useStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockAdjustment }) =>
      apiPost<Product>(`/products/${id}/adjust`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.movements(variables.id) });
    },
  });
}

/** Fetch stock movement log for a product */
export function useStockMovements(productId: string) {
  return useQuery({
    queryKey: productKeys.movements(productId),
    queryFn: () => apiFetch<StockMovement[]>(`/products/${productId}/movements`),
    staleTime: 60 * 1000,
    enabled: !!productId,
  });
}
