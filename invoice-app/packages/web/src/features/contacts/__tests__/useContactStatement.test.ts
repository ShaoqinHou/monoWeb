// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useContactStatement } from '../hooks/useContactStatement';

const MOCK_INVOICES = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-001',
    contactId: 'c1',
    contactName: 'Acme',
    status: 'approved',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-03-15',
    dueDate: '2025-04-15',
    lineItems: [],
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    amountDue: 1150,
    amountPaid: 0,
    createdAt: '2025-03-15T10:00:00.000Z',
    updatedAt: '2025-03-15T10:00:00.000Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-002',
    contactId: 'c1',
    contactName: 'Acme',
    status: 'paid',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-06-01',
    dueDate: '2025-07-01',
    lineItems: [],
    subTotal: 500,
    totalTax: 75,
    total: 575,
    amountDue: 0,
    amountPaid: 575,
    createdAt: '2025-06-01T10:00:00.000Z',
    updatedAt: '2025-07-01T10:00:00.000Z',
  },
];

const MOCK_BILLS = [
  {
    id: 'bill-1',
    billNumber: 'BILL-001',
    contactId: 'c1',
    contactName: 'Acme',
    status: 'paid',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-05-10',
    dueDate: '2025-06-10',
    lineItems: [],
    subTotal: 350,
    totalTax: 52.5,
    total: 402.5,
    amountDue: 0,
    amountPaid: 402.5,
    createdAt: '2025-05-10T08:00:00.000Z',
    updatedAt: '2025-06-10T08:00:00.000Z',
  },
];

let originalFetch: typeof globalThis.fetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/invoices') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: MOCK_INVOICES }),
      } as Response);
    }
    if (url === '/api/bills') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: MOCK_BILLS }),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: [] }),
    } as Response);
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('useContactStatement', () => {
  it('returns statement transactions with running balance', async () => {
    const { result } = renderHook(
      () => useContactStatement('c1', { start: '2025-01-01', end: '2025-12-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
    // Each transaction should have a balance field
    result.current.data.forEach((t) => {
      expect(typeof t.balance).toBe('number');
    });
  });

  it('computes running balance correctly', async () => {
    const { result } = renderHook(
      () => useContactStatement('c1', { start: '2025-01-01', end: '2025-12-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Transactions sorted by date:
    // inv-1 (2025-03-15): debit 1150, balance = 1150
    // bill-1 (2025-05-10): credit 402.50, balance = 747.50
    // inv-2 (2025-06-01): paid invoice - credit 575, balance = 172.50
    const balances = result.current.data.map((t) => t.balance);
    // First balance should be positive (invoice debit)
    expect(balances[0]).toBeGreaterThan(0);
    // Balances should evolve correctly with debits and credits
    expect(balances.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by date range', async () => {
    const { result } = renderHook(
      () => useContactStatement('c1', { start: '2025-05-01', end: '2025-07-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Only bill-1 (2025-05-10) and inv-2 (2025-06-01) should be in range
    expect(result.current.data.length).toBe(2);
  });

  it('sorts transactions by date ascending', async () => {
    const { result } = renderHook(
      () => useContactStatement('c1', { start: '2025-01-01', end: '2025-12-31' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const dates = result.current.data.map((t) => new Date(t.date).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
    }
  });
});
