import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';

export interface SupplierPrepayment {
  id: string;
  contactId: string;
  contactName: string;
  amount: number;
  balance: number;
  date: string;
  reference: string;
  createdAt: string;
}

interface CreatePrepaymentData {
  contactId: string;
  amount: number;
  date: string;
  reference: string;
}

const prepaymentKeys = {
  all: ['supplier-prepayments'] as const,
  lists: () => [...prepaymentKeys.all, 'list'] as const,
};

export function useSupplierPrepayments() {
  return useQuery({
    queryKey: prepaymentKeys.lists(),
    queryFn: () => apiFetch<SupplierPrepayment[]>('/supplier-prepayments'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSupplierPrepayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrepaymentData) =>
      apiPost<SupplierPrepayment>('/supplier-prepayments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prepaymentKeys.lists() });
    },
  });
}
