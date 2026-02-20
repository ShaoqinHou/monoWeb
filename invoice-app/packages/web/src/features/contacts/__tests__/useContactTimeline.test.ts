// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useContactTimeline } from '../hooks/useContactTimeline';

const MOCK_INVOICES = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-001',
    contactId: 'c1',
    contactName: 'Acme',
    status: 'approved',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2025-07-15',
    dueDate: '2025-08-15',
    lineItems: [],
    subTotal: 500,
    totalTax: 75,
    total: 575,
    amountDue: 575,
    amountPaid: 0,
    createdAt: '2025-07-15T10:00:00.000Z',
    updatedAt: '2025-07-15T10:00:00.000Z',
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
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    amountDue: 0,
    amountPaid: 1150,
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

describe('useContactTimeline', () => {
  it('returns timeline events from invoices and bills', async () => {
    const { result } = renderHook(() => useContactTimeline('c1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.length).toBeGreaterThan(0);
  });

  it('includes invoice_created events', async () => {
    const { result } = renderHook(() => useContactTimeline('c1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const invoiceEvents = result.current.data.filter(
      (e) => e.type === 'invoice_created' || e.type === 'invoice_paid',
    );
    expect(invoiceEvents.length).toBeGreaterThan(0);
  });

  it('includes bill_created events', async () => {
    const { result } = renderHook(() => useContactTimeline('c1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const billEvents = result.current.data.filter(
      (e) => e.type === 'bill_created' || e.type === 'bill_paid',
    );
    expect(billEvents.length).toBeGreaterThan(0);
  });

  it('sorts events by date descending', async () => {
    const { result } = renderHook(() => useContactTimeline('c1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const dates = result.current.data.map((e) => new Date(e.date).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  it('includes amounts on events', async () => {
    const { result } = renderHook(() => useContactTimeline('c1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const withAmount = result.current.data.filter((e) => e.amount !== undefined);
    expect(withAmount.length).toBeGreaterThan(0);
  });
});
