import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankRuleKeys } from './bankRuleKeys';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export type MatchField = 'description' | 'reference' | 'amount';
export type MatchType = 'contains' | 'equals' | 'starts_with';

export type RuleDirection = 'spend' | 'receive' | 'transfer';

export interface BankRule {
  id: string;
  name: string;
  direction?: RuleDirection;
  accountId: string;
  matchField: MatchField;
  matchType: MatchType;
  matchValue: string;
  allocateToAccountCode: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBankRule {
  name: string;
  accountId: string;
  matchField?: MatchField;
  matchType?: MatchType;
  matchValue: string;
  allocateToAccountCode: string;
  taxRate?: number;
  isActive?: boolean;
}

export interface UpdateBankRule {
  name?: string;
  accountId?: string;
  matchField?: MatchField;
  matchType?: MatchType;
  matchValue?: string;
  allocateToAccountCode?: string;
  taxRate?: number;
  isActive?: boolean;
}

export function useBankRules() {
  return useQuery({
    queryKey: bankRuleKeys.lists(),
    queryFn: () => apiFetch<BankRule[]>('/bank-rules'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBankRule(id: string) {
  return useQuery({
    queryKey: bankRuleKeys.detail(id),
    queryFn: () => apiFetch<BankRule>(`/bank-rules/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateBankRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBankRule) =>
      apiPost<BankRule>('/bank-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankRuleKeys.lists() });
      showToast('success', 'Bank rule created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create bank rule');
    },
  });
}

export function useUpdateBankRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankRule }) =>
      apiPut<BankRule>(`/bank-rules/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bankRuleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankRuleKeys.detail(variables.id) });
      showToast('success', 'Bank rule updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update bank rule');
    },
  });
}

export function useDeleteBankRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/bank-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankRuleKeys.lists() });
      showToast('success', 'Bank rule deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete bank rule');
    },
  });
}
