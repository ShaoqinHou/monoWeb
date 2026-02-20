import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';

export interface RuleCondition {
  field: 'description' | 'payee' | 'amount' | 'reference';
  operator: 'contains' | 'equals' | 'between';
  value: string;
}

export interface CreateRuleFromTransactionParams {
  name: string;
  conditions: RuleCondition[];
  accountCode: string;
  taxRate?: string;
}

export interface BankRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  accountCode: string;
  taxRate?: string;
  createdAt: string;
}

/** Pre-generate rule conditions from a transaction's fields */
export function generateRuleConditions(transaction: {
  description: string;
  amount: number;
  reference?: string | null;
}): RuleCondition[] {
  const conditions: RuleCondition[] = [];

  if (transaction.description) {
    conditions.push({
      field: 'description',
      operator: 'contains',
      value: transaction.description,
    });
  }

  if (transaction.amount !== 0) {
    const margin = Math.abs(transaction.amount) * 0.1;
    const low = (transaction.amount - margin).toFixed(2);
    const high = (transaction.amount + margin).toFixed(2);
    conditions.push({
      field: 'amount',
      operator: 'between',
      value: `${low},${high}`,
    });
  }

  if (transaction.reference) {
    conditions.push({
      field: 'reference',
      operator: 'contains',
      value: transaction.reference,
    });
  }

  return conditions;
}

/** Create a bank rule from transaction data */
export function useCreateRuleFromTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateRuleFromTransactionParams): Promise<BankRule> => {
      return apiPost<BankRule>('/bank-rules', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
