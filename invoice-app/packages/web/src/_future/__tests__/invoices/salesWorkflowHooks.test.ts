// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useConvertQuoteToInvoice } from '../hooks/useConvertQuote';
import { useGenerateDueRecurringInvoices, useGenerateDueRecurringBills } from '../hooks/useGenerateDueRecurring';
import { useAutoAllocateCredit } from '../hooks/useAutoAllocateCredit';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function mockFetchSuccess(data: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data }),
  } as Response);
}

describe('Sales workflow hooks', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('useConvertQuoteToInvoice', () => {
    it('posts to /api/quotes/:id/convert', async () => {
      fetchSpy = mockFetchSuccess({ id: 'inv-1', sourceQuoteId: 'q-1' });
      const { result } = renderHook(() => useConvertQuoteToInvoice(), { wrapper: createWrapper() });
      result.current.mutate('q-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes/q-1/convert',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('useGenerateDueRecurringInvoices', () => {
    it('posts to /api/recurring-invoices/generate-due', async () => {
      fetchSpy = mockFetchSuccess({ generated: [{ invoiceId: 'i1', recurringId: 'r1', invoiceNumber: 'INV-0001' }] });
      const { result } = renderHook(() => useGenerateDueRecurringInvoices(), { wrapper: createWrapper() });
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/recurring-invoices/generate-due',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('useGenerateDueRecurringBills', () => {
    it('posts to /api/recurring-bills/generate-due', async () => {
      fetchSpy = mockFetchSuccess({ generated: [{ billId: 'b1', recurringId: 'r1', billNumber: 'BILL-0001' }] });
      const { result } = renderHook(() => useGenerateDueRecurringBills(), { wrapper: createWrapper() });
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/recurring-bills/generate-due',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('useAutoAllocateCredit', () => {
    it('posts to /api/credit-notes/:id/auto-allocate', async () => {
      fetchSpy = mockFetchSuccess({
        creditNote: { id: 'cn-1', remainingCredit: 0, status: 'applied' },
        allocations: [{ invoiceId: 'i1', invoiceNumber: 'INV-0001', amount: 100 }],
      });
      const { result } = renderHook(() => useAutoAllocateCredit(), { wrapper: createWrapper() });
      result.current.mutate('cn-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/credit-notes/cn-1/auto-allocate',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
