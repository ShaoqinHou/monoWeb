import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';
import type { ApiBankTransaction, BankTransaction } from '../types';

/** Convert API shape to frontend view */
function toView(tx: ApiBankTransaction): BankTransaction {
  const result: BankTransaction = {
    id: tx.id,
    date: tx.date,
    description: tx.description,
    amount: tx.amount,
    status: tx.isReconciled ? 'matched' : 'unmatched',
  };
  if (tx.matchedInvoiceId) {
    result.matchedTo = { type: 'invoice', id: tx.matchedInvoiceId, reference: tx.matchedInvoiceId };
  } else if (tx.matchedBillId) {
    result.matchedTo = { type: 'bill', id: tx.matchedBillId, reference: tx.matchedBillId };
  }
  return result;
}

/** Fetch transactions for an account, optionally filtered */
export function useBankTransactionsList(accountId?: string) {
  return useQuery({
    queryKey: bankKeys.transactions(accountId),
    queryFn: async (): Promise<BankTransaction[]> => {
      const url = accountId
        ? `/bank-transactions?accountId=${accountId}`
        : '/bank-transactions';
      const raw = await apiFetch<ApiBankTransaction[]>(url);
      return raw.map(toView);
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!accountId,
  });
}

/** Create a bank transaction via POST /api/bank-transactions */
export function useCreateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      accountId: string;
      date: string;
      description: string;
      amount: number;
      reference?: string;
      category?: string;
    }): Promise<ApiBankTransaction> => {
      return apiPost<ApiBankTransaction>('/bank-transactions', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}

/** Update a bank transaction via PUT /api/bank-transactions/:id */
export function useUpdateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      category?: string;
      isReconciled?: boolean;
    }): Promise<ApiBankTransaction> => {
      const { id, ...body } = params;
      return apiPut<ApiBankTransaction>(`/bank-transactions/${id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}

/** Undo reconciliation — sets isReconciled=false via PUT /api/bank-transactions/:id */
export function useUndoReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ApiBankTransaction> => {
      return apiPut<ApiBankTransaction>(`/bank-transactions/${id}`, {
        isReconciled: false,
        matchedInvoiceId: null,
        matchedBillId: null,
        category: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
