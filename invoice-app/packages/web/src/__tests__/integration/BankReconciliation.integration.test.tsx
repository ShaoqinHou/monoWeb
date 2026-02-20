// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost, apiPut } from '../../lib/api-helpers';
import {
  useBankAccounts,
  useBankTransactions,
  useImportTransactions,
  useReconcileTransaction,
} from '../../features/accounting/bank/hooks/useBank';
import { useCreateBankTransaction } from '../../features/accounting/bank/hooks/useBankTransactions';
import { useAutoMatchSuggestions, useApplyAutoMatch } from '../../features/accounting/bank/hooks/useAutoMatch';

const mockedApiFetch = vi.mocked(apiFetch);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Bank Reconciliation Integration', () => {
  it('imports CSV transactions which appear in unreconciled list', async () => {
    const importResult = { imported: 3 };

    // Mock the import
    mockedApiPost.mockResolvedValueOnce(importResult);

    // Mock fetching transactions after import (triggered by query invalidation)
    const transactions = [
      { id: 'tx-1', accountId: 'acc-1', date: '2026-02-01', description: 'Payment from ABC', amount: 500, isReconciled: false, matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null, category: null, createdAt: '2026-02-01T00:00:00Z' },
      { id: 'tx-2', accountId: 'acc-1', date: '2026-02-02', description: 'Transfer In', amount: 1000, isReconciled: false, matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null, category: null, createdAt: '2026-02-02T00:00:00Z' },
      { id: 'tx-3', accountId: 'acc-1', date: '2026-02-03', description: 'Office Supplies', amount: -200, isReconciled: false, matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null, category: null, createdAt: '2026-02-03T00:00:00Z' },
    ];
    mockedApiFetch.mockResolvedValue(transactions);

    const wrapper = createWrapper();

    // Import transactions
    const { result: importHook } = renderHook(() => useImportTransactions(), { wrapper });
    await act(async () => {
      const result = await importHook.current.mutateAsync({
        accountId: 'acc-1',
        transactions: [
          { date: '2026-02-01', description: 'Payment from ABC', amount: 500 },
          { date: '2026-02-02', description: 'Transfer In', amount: 1000 },
          { date: '2026-02-03', description: 'Office Supplies', amount: -200 },
        ],
      });
      expect(result.imported).toBe(3);
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/bank-transactions/import', expect.objectContaining({
      accountId: 'acc-1',
    }));

    // Fetch transactions for the account
    const { result: txResult } = renderHook(() => useBankTransactions('acc-1'), { wrapper });
    await waitFor(() => expect(txResult.current.isSuccess).toBe(true));

    expect(txResult.current.data).toHaveLength(3);
    expect(txResult.current.data!.every((tx) => tx.status === 'unmatched')).toBe(true);
  });

  it('matches transaction to invoice payment and reconciles', async () => {
    const reconciledTx = {
      id: 'tx-1',
      accountId: 'acc-1',
      date: '2026-02-01',
      description: 'Payment from ABC',
      amount: 500,
      isReconciled: true,
      matchedInvoiceId: 'inv-1',
      matchedBillId: null,
      matchedPaymentId: null,
      category: 'INV-001',
      createdAt: '2026-02-01T00:00:00Z',
    };

    mockedApiPut.mockResolvedValueOnce(reconciledTx);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useReconcileTransaction(), { wrapper });
    await act(async () => {
      const result2 = await result.current.mutateAsync({
        transactionId: 'tx-1',
        matchType: 'invoice',
        matchId: 'inv-1',
        matchReference: 'INV-001',
        amount: 500,
        date: '2026-02-01',
      });
      expect(result2.isReconciled).toBe(true);
      expect(result2.matchedInvoiceId).toBe('inv-1');
    });

    expect(mockedApiPut).toHaveBeenCalledWith('/bank-transactions/tx-1/reconcile', {
      category: 'INV-001',
      invoiceId: 'inv-1',
    });
  });

  it('bank rule auto-matches transaction', async () => {
    const suggestions = [
      {
        ruleId: 'rule-1',
        ruleName: 'Office Supplies Rule',
        accountCode: '400',
        confidence: 0.95,
        matchedField: 'description',
      },
    ];

    const applyResult = { success: true };

    mockedApiFetch.mockResolvedValueOnce(suggestions);
    mockedApiPost.mockResolvedValueOnce(applyResult);

    const wrapper = createWrapper();

    // Fetch auto-match suggestions
    const { result: suggestionsResult } = renderHook(
      () => useAutoMatchSuggestions('tx-3'),
      { wrapper },
    );

    await waitFor(() => expect(suggestionsResult.current.isSuccess).toBe(true));
    expect(suggestionsResult.current.data).toHaveLength(1);
    expect(suggestionsResult.current.data![0].ruleName).toBe('Office Supplies Rule');

    // Apply the rule
    const { result: applyHook } = renderHook(() => useApplyAutoMatch(), { wrapper });
    await act(async () => {
      const r = await applyHook.current.mutateAsync({ transactionId: 'tx-3', ruleId: 'rule-1' });
      expect(r.success).toBe(true);
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/bank-transactions/tx-3/apply-rule', { ruleId: 'rule-1' });
  });

  it('spend money creates bank transaction', async () => {
    const createdTx = {
      id: 'tx-spend-1',
      accountId: 'acc-1',
      date: '2026-02-10',
      description: 'Software subscription',
      amount: -99.99,
      isReconciled: false,
      matchedInvoiceId: null,
      matchedBillId: null,
      matchedPaymentId: null,
      category: 'Software',
      createdAt: '2026-02-10T00:00:00Z',
    };

    mockedApiPost.mockResolvedValueOnce(createdTx);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useCreateBankTransaction(), { wrapper });
    await act(async () => {
      const tx = await result.current.mutateAsync({
        accountId: 'acc-1',
        date: '2026-02-10',
        description: 'Software subscription',
        amount: -99.99,
        category: 'Software',
      });
      expect(tx.amount).toBe(-99.99);
      expect(tx.description).toBe('Software subscription');
    });

    expect(mockedApiPost).toHaveBeenCalledWith('/bank-transactions', expect.objectContaining({
      amount: -99.99,
      description: 'Software subscription',
    }));
  });

  it('receive money creates bank transaction', async () => {
    const createdTx = {
      id: 'tx-recv-1',
      accountId: 'acc-1',
      date: '2026-02-12',
      description: 'Consulting payment received',
      amount: 2500,
      isReconciled: false,
      matchedInvoiceId: null,
      matchedBillId: null,
      matchedPaymentId: null,
      category: 'Consulting',
      reference: 'REF-123',
      createdAt: '2026-02-12T00:00:00Z',
    };

    mockedApiPost.mockResolvedValueOnce(createdTx);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useCreateBankTransaction(), { wrapper });
    await act(async () => {
      const tx = await result.current.mutateAsync({
        accountId: 'acc-1',
        date: '2026-02-12',
        description: 'Consulting payment received',
        amount: 2500,
        reference: 'REF-123',
        category: 'Consulting',
      });
      expect(tx.amount).toBe(2500);
    });
  });

  it('reconciles bill payment (outflow matched to bill)', async () => {
    const reconciledTx = {
      id: 'tx-out-1',
      accountId: 'acc-1',
      date: '2026-02-05',
      description: 'Payment to supplier',
      amount: -750,
      isReconciled: true,
      matchedInvoiceId: null,
      matchedBillId: 'bill-1',
      matchedPaymentId: null,
      category: 'BILL-001',
      createdAt: '2026-02-05T00:00:00Z',
    };

    mockedApiPut.mockResolvedValueOnce(reconciledTx);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useReconcileTransaction(), { wrapper });
    await act(async () => {
      const r = await result.current.mutateAsync({
        transactionId: 'tx-out-1',
        matchType: 'bill',
        matchId: 'bill-1',
        matchReference: 'BILL-001',
        amount: 750,
        date: '2026-02-05',
      });
      expect(r.isReconciled).toBe(true);
      expect(r.matchedBillId).toBe('bill-1');
    });

    expect(mockedApiPut).toHaveBeenCalledWith('/bank-transactions/tx-out-1/reconcile', {
      category: 'BILL-001',
      billId: 'bill-1',
    });
  });

  it('fetches bank accounts list', async () => {
    const accounts = [
      { id: 'acc-1', code: '1000', name: 'Main Checking', type: 'asset', description: null, isArchived: false },
      { id: 'acc-2', code: '1010', name: 'Savings', type: 'asset', description: null, isArchived: false },
    ];

    mockedApiFetch.mockResolvedValueOnce(accounts);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBankAccounts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].name).toBe('Main Checking');
  });
});
