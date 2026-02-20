import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

interface ProductListItem {
  id: string;
  code: string;
  name: string;
  salePrice: number;
}

export function useProductList() {
  return useQuery({
    queryKey: ['invoices', 'products'],
    queryFn: () => apiFetch<ProductListItem[]>('/products'),
    staleTime: 5 * 60 * 1000,
  });
}
