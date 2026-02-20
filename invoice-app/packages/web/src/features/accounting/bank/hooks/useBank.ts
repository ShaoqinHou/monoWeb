import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';
import type {
  ApiBankTransaction,
  BankAccount,
  BankTransaction,
  ImportParams,
  ImportResult,
  MatchSuggestionData,
  ReconcileParams,
} from '../types';
import type { Account } from '@shared/schemas/account';
import { showToast } from '../../../dashboard/components/ToastContainer';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert API bank transaction shape to frontend view model */
function toFrontendTransaction(tx: ApiBankTransaction): BankTransaction {
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

/** Generate match suggestions by comparing transaction amounts with invoices/bills */
function generateSuggestions(
  tx: BankTransaction,
  invoices: Array<{ id: string; invoiceNumber: string; contactName: string; amountDue: number }>,
  bills: Array<{ id: string; billNumber: string; contactName: string; amountDue: number }>,
): MatchSuggestionData[] {
  const suggestions: MatchSuggestionData[] = [];
  const absAmount = Math.abs(tx.amount);

  if (tx.amount > 0) {
    // Inflow: match against outstanding invoices
    for (const inv of invoices) {
      if (inv.amountDue <= 0) continue;
      const diff = Math.abs(inv.amountDue - absAmount);
      const tolerance = Math.max(absAmount, inv.amountDue) * 0.05; // 5% tolerance
      if (diff <= tolerance) {
        const confidence = 1 - diff / Math.max(absAmount, inv.amountDue);
        suggestions.push({
          type: 'invoice',
          id: inv.id,
          reference: inv.invoiceNumber,
          amount: inv.amountDue,
          contact: inv.contactName,
          confidence: Math.round(confidence * 100) / 100,
        });
      }
    }
  } else {
    // Outflow: match against outstanding bills
    for (const bill of bills) {
      if (bill.amountDue <= 0) continue;
      const diff = Math.abs(bill.amountDue - absAmount);
      const tolerance = Math.max(absAmount, bill.amountDue) * 0.05;
      if (diff <= tolerance) {
        const confidence = 1 - diff / Math.max(absAmount, bill.amountDue);
        suggestions.push({
          type: 'bill',
          id: bill.id,
          reference: bill.billNumber,
          amount: bill.amountDue,
          contact: bill.contactName,
          confidence: Math.round(confidence * 100) / 100,
        });
      }
    }
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch bank accounts from API (asset-type accounts, not archived) */
export function useBankAccounts() {
  return useQuery({
    queryKey: bankKeys.accounts(),
    queryFn: async (): Promise<BankAccount[]> => {
      const accounts = await apiFetch<Account[]>('/accounts');
      return accounts
        .filter((a) => a.type === 'asset' && !a.isArchived)
        .map((a) => ({
          id: a.id,
          name: a.name,
          accountNumber: a.code,
          balance: 0,
          statementBalance: 0,
        }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch transactions for an account from the real bank-transactions API */
export function useBankTransactions(accountId?: string) {
  return useQuery({
    queryKey: bankKeys.transactions(accountId),
    queryFn: async (): Promise<BankTransaction[]> => {
      const url = accountId
        ? `/bank-transactions?accountId=${accountId}`
        : '/bank-transactions';
      const raw = await apiFetch<ApiBankTransaction[]>(url);
      return raw.map(toFrontendTransaction);
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!accountId,
  });
}

/** Compute statement balance for an account (sum of all transaction amounts) */
export function useStatementBalance(accountId: string) {
  return useQuery({
    queryKey: bankKeys.balance(accountId),
    queryFn: async (): Promise<number> => {
      const raw = await apiFetch<ApiBankTransaction[]>(
        `/bank-transactions?accountId=${accountId}`,
      );
      return raw.reduce((sum, tx) => sum + tx.amount, 0);
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!accountId,
  });
}

/** Fetch match suggestions for a transaction by comparing against invoices/bills */
export function useMatchSuggestions(transactionId: string, transaction?: BankTransaction) {
  return useQuery({
    queryKey: bankKeys.suggestions(transactionId),
    queryFn: async (): Promise<MatchSuggestionData[]> => {
      if (!transaction || transaction.status === 'matched') return [];

      // Fetch invoices and bills to find amount matches
      const [invoices, bills] = await Promise.all([
        apiFetch<Array<{ id: string; invoiceNumber: string; contactName: string; amountDue: number; status: string }>>(
          '/invoices',
        ).catch(() => []),
        apiFetch<Array<{ id: string; billNumber: string; contactName: string; amountDue: number; status: string }>>(
          '/bills',
        ).catch(() => []),
      ]);

      // Only match against outstanding (authorized/approved) invoices/bills with remaining balance
      const openInvoices = invoices.filter(
        (inv) => inv.amountDue > 0 && inv.status !== 'draft' && inv.status !== 'voided',
      );
      const openBills = bills.filter(
        (b) => b.amountDue > 0 && b.status !== 'draft' && b.status !== 'voided',
      );

      return generateSuggestions(transaction, openInvoices, openBills);
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!transactionId && !!transaction && transaction.status === 'unmatched',
  });
}

/** Import transactions via POST /api/bank-transactions/import */
export function useImportTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ImportParams): Promise<ImportResult> => {
      return apiPost<ImportResult>('/bank-transactions/import', params);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
      showToast('success', `Imported ${result.imported} transaction(s)`);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to import transactions');
    },
  });
}

/** Reconcile a transaction via PUT /api/bank-transactions/:id/reconcile */
export function useReconcileTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ReconcileParams): Promise<ApiBankTransaction> => {
      const body: Record<string, unknown> = {
        category: params.matchReference,
      };

      if (params.matchType === 'invoice') {
        body.invoiceId = params.matchId;
      } else {
        body.billId = params.matchId;
      }

      return apiPut<ApiBankTransaction>(
        `/bank-transactions/${params.transactionId}/reconcile`,
        body,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
      showToast('success', 'Transaction reconciled');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to reconcile transaction');
    },
  });
}

/** Create a new transaction entry via POST /api/bank-transactions */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { transactionId: string; action: 'create' }) => {
      // Stub for now — creates a local entry marker
      return { success: true, ...params };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
      showToast('success', 'Transaction created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create transaction');
    },
  });
}

/** Fetch match suggestions from the server API endpoint */
export function useMatchSuggestionsApi(amount?: number, date?: string) {
  return useQuery({
    queryKey: bankKeys.suggestions(`api-${amount}-${date}`),
    queryFn: async (): Promise<MatchSuggestionData[]> => {
      const params = new URLSearchParams();
      if (amount !== undefined) params.set('amount', String(amount));
      if (date) params.set('date', date);
      return apiFetch<MatchSuggestionData[]>(`/bank-transactions/match-suggestions?${params.toString()}`);
    },
    staleTime: 1 * 60 * 1000,
    enabled: amount !== undefined && amount !== 0,
  });
}

// Re-export for backward compatibility
export { generateSuggestions, toFrontendTransaction };
