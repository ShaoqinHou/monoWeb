// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useBankAccounts,
  useBankTransactions,
  useMatchSuggestions,
  useReconcileTransaction,
  useImportTransactions,
  useStatementBalance,
  generateSuggestions,
  toFrontendTransaction,
} from '../hooks/useBank';
import type { ReactNode } from 'react';
import type { ApiBankTransaction, BankTransaction } from '../types';

beforeEach(() => {
  vi.restoreAllMocks();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// ── Helper: toFrontendTransaction ─────────────────────────────────────────

describe('toFrontendTransaction', () => {
  it('converts API transaction to frontend view', () => {
    const api: ApiBankTransaction = {
      id: 'bt-1',
      accountId: 'a-1',
      date: '2026-02-10',
      description: 'Test payment',
      reference: null,
      amount: 1500,
      isReconciled: false,
      matchedInvoiceId: null,
      matchedBillId: null,
      matchedPaymentId: null,
      category: null,
      createdAt: '2026-02-10T00:00:00Z',
    };
    const result = toFrontendTransaction(api);
    expect(result).toEqual({
      id: 'bt-1',
      date: '2026-02-10',
      description: 'Test payment',
      amount: 1500,
      status: 'unmatched',
    });
  });

  it('sets status to matched when isReconciled is true', () => {
    const api: ApiBankTransaction = {
      id: 'bt-2',
      accountId: 'a-1',
      date: '2026-02-10',
      description: 'Reconciled',
      reference: null,
      amount: 500,
      isReconciled: true,
      matchedInvoiceId: 'inv-1',
      matchedBillId: null,
      matchedPaymentId: null,
      category: null,
      createdAt: '2026-02-10T00:00:00Z',
    };
    const result = toFrontendTransaction(api);
    expect(result.status).toBe('matched');
    expect(result.matchedTo).toEqual({ type: 'invoice', id: 'inv-1', reference: 'inv-1' });
  });
});

// ── Helper: generateSuggestions ───────────────────────────────────────────

describe('generateSuggestions', () => {
  it('matches inflow transaction to invoice with similar amount', () => {
    const tx: BankTransaction = {
      id: 'txn-1', date: '2026-02-10', description: 'Payment', amount: 1000, status: 'unmatched',
    };
    const invoices = [{ id: 'inv-1', invoiceNumber: 'INV-001', contactName: 'Client A', amountDue: 1000 }];
    const result = generateSuggestions(tx, invoices, []);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('invoice');
    expect(result[0].confidence).toBe(1);
  });

  it('matches outflow transaction to bill with similar amount', () => {
    const tx: BankTransaction = {
      id: 'txn-2', date: '2026-02-10', description: 'Expense', amount: -500, status: 'unmatched',
    };
    const bills = [{ id: 'bill-1', billNumber: 'BILL-001', contactName: 'Vendor A', amountDue: 500 }];
    const result = generateSuggestions(tx, [], bills);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('bill');
    expect(result[0].confidence).toBe(1);
  });

  it('returns empty when amounts differ by more than 5%', () => {
    const tx: BankTransaction = {
      id: 'txn-3', date: '2026-02-10', description: 'Payment', amount: 1000, status: 'unmatched',
    };
    const invoices = [{ id: 'inv-2', invoiceNumber: 'INV-002', contactName: 'Client B', amountDue: 2000 }];
    const result = generateSuggestions(tx, invoices, []);
    expect(result).toHaveLength(0);
  });
});

// ── useBankAccounts ───────────────────────────────────────────────────────

describe('useBankAccounts', () => {
  it('fetches from /api/accounts and filters asset type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: [
          { id: 'a1', code: '1000', name: 'Cheque', type: 'asset', taxType: 'none', isArchived: false },
          { id: 'a2', code: '4000', name: 'Revenue', type: 'revenue', taxType: 'output', isArchived: false },
          { id: 'a3', code: '1010', name: 'Archived Bank', type: 'asset', taxType: 'none', isArchived: true },
        ],
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBankAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Only non-archived asset accounts
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toEqual({
      id: 'a1',
      name: 'Cheque',
      accountNumber: '1000',
      balance: 0,
      statementBalance: 0,
    });
  });

  it('calls /api/accounts endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: [] }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBankAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/accounts',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('returns error when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'Internal error' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBankAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

// ── useBankTransactions (now API-driven) ──────────────────────────────────

describe('useBankTransactions', () => {
  it('fetches from /api/bank-transactions?accountId=X and transforms data', async () => {
    const apiData: ApiBankTransaction[] = [
      {
        id: 'bt-1', accountId: 'acc-1', date: '2026-02-14', description: 'Test Payment',
        reference: null, amount: 1500, isReconciled: false,
        matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null,
        category: null, createdAt: '2026-02-14T00:00:00Z',
      },
      {
        id: 'bt-2', accountId: 'acc-1', date: '2026-02-13', description: 'Rent',
        reference: null, amount: -2000, isReconciled: true,
        matchedInvoiceId: null, matchedBillId: 'bill-1', matchedPaymentId: null,
        category: null, createdAt: '2026-02-13T00:00:00Z',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ ok: true, data: apiData }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBankTransactions('acc-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].status).toBe('unmatched');
    expect(result.current.data![1].status).toBe('matched');
    expect(result.current.data![1].matchedTo).toEqual({ type: 'bill', id: 'bill-1', reference: 'bill-1' });
  });

  it('calls /api/bank-transactions with accountId query param', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ ok: true, data: [] }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBankTransactions('acc-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions?accountId=acc-1',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('is disabled when accountId is empty', () => {
    const { result } = renderHook(() => useBankTransactions(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ── useStatementBalance ───────────────────────────────────────────────────

describe('useStatementBalance', () => {
  it('computes sum of transaction amounts for account', async () => {
    const apiData: ApiBankTransaction[] = [
      {
        id: 'bt-1', accountId: 'acc-1', date: '2026-02-14', description: 'In',
        reference: null, amount: 3000, isReconciled: false,
        matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null,
        category: null, createdAt: '2026-02-14T00:00:00Z',
      },
      {
        id: 'bt-2', accountId: 'acc-1', date: '2026-02-13', description: 'Out',
        reference: null, amount: -1000, isReconciled: false,
        matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null,
        category: null, createdAt: '2026-02-13T00:00:00Z',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ ok: true, data: apiData }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useStatementBalance('acc-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(2000); // 3000 + (-1000)
  });
});

// ── useImportTransactions ─────────────────────────────────────────────────

describe('useImportTransactions', () => {
  it('posts to /api/bank-transactions/import with account and rows', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ ok: true, data: { imported: 2 } }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useImportTransactions(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        accountId: 'acc-1',
        transactions: [
          { date: '2026-02-15', description: 'Payment A', amount: 500 },
          { date: '2026-02-16', description: 'Payment B', amount: -200 },
        ],
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ imported: 2 });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions/import',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          accountId: 'acc-1',
          transactions: [
            { date: '2026-02-15', description: 'Payment A', amount: 500 },
            { date: '2026-02-16', description: 'Payment B', amount: -200 },
          ],
        }),
      }),
    );
  });

  it('returns error on import failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ ok: false, error: 'Missing accountId' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useImportTransactions(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        accountId: '',
        transactions: [],
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

// ── useReconcileTransaction ───────────────────────────────────────────────

describe('useReconcileTransaction', () => {
  it('puts to /api/bank-transactions/:id/reconcile with invoice match', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        ok: true,
        data: {
          id: 'bt-1', accountId: 'acc-1', date: '2026-02-14', description: 'Test',
          amount: 1500, isReconciled: true, matchedInvoiceId: 'inv-1',
          matchedBillId: null, matchedPaymentId: null, category: 'INV-001',
          reference: null, createdAt: '2026-02-14T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useReconcileTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        transactionId: 'bt-1',
        matchType: 'invoice',
        matchId: 'inv-1',
        matchReference: 'INV-001',
        amount: 1500,
        date: '2026-02-14',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions/bt-1/reconcile',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          category: 'INV-001',
          invoiceId: 'inv-1',
        }),
      }),
    );
  });

  it('puts to /api/bank-transactions/:id/reconcile with bill match', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({
        ok: true,
        data: {
          id: 'bt-2', accountId: 'acc-1', date: '2026-02-13', description: 'Expense',
          amount: -500, isReconciled: true, matchedInvoiceId: null,
          matchedBillId: 'bill-1', matchedPaymentId: null, category: 'BILL-001',
          reference: null, createdAt: '2026-02-13T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useReconcileTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        transactionId: 'bt-2',
        matchType: 'bill',
        matchId: 'bill-1',
        matchReference: 'BILL-001',
        amount: 500,
        date: '2026-02-13',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions/bt-2/reconcile',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          category: 'BILL-001',
          billId: 'bill-1',
        }),
      }),
    );
  });
});
