import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
}

export function useTaxRates() {
  return useQuery({
    queryKey: ['tax-rates'],
    queryFn: () => apiFetch<TaxRate[]>('/tax-rates'),
    staleTime: 5 * 60 * 1000,
  });
}
