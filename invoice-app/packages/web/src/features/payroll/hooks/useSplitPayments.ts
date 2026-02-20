import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export interface SplitPaymentAccount {
  bankAccount: string;
  type: 'fixed' | 'percentage';
  amount: number; // dollar amount if fixed, percentage if percentage
  isPrimary: boolean;
}

export interface SplitPaymentConfig {
  employeeId: string;
  accounts: SplitPaymentAccount[];
}

export interface UpdateSplitPaymentsInput {
  employeeId: string;
  accounts: SplitPaymentAccount[];
}

export function useSplitPayments(employeeId: string) {
  return useQuery({
    queryKey: ['payroll', 'split-payments', employeeId],
    queryFn: () => apiFetch<SplitPaymentConfig>(`/payroll-settings/split-payments/${employeeId}`),
    staleTime: 60 * 1000,
    enabled: !!employeeId,
  });
}

export function useUpdateSplitPayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSplitPaymentsInput) =>
      apiPut<SplitPaymentConfig>(`/payroll-settings/split-payments/${input.employeeId}`, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'split-payments', variables.employeeId] });
      showToast('success', 'Split payments saved');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save split payments'),
  });
}
