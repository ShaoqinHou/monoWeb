import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useInvoices,
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useTransitionInvoice,
  useRecordPayment,
} from '../hooks/useInvoices';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const SAMPLE_INVOICE = {
  id: 'inv-1',
  invoiceNumber: 'INV-0001',
  contactId: 'c1',
  contactName: 'Test',
  status: 'draft',
  total: 100,
};

function mockFetchSuccess(data: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data }),
  } as Response);
}

describe('useInvoices hooks — API wiring', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('useInvoices', () => {
    it('fetches /api/invoices', async () => {
      fetchSpy = mockFetchSuccess([SAMPLE_INVOICE]);
      const { result } = renderHook(() => useInvoices(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/invoices',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
      );
      expect(result.current.data).toEqual([SAMPLE_INVOICE]);
    });
  });

  describe('useInvoice', () => {
    it('fetches /api/invoices/:id', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_INVOICE);
      const { result } = renderHook(() => useInvoice('inv-1'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/invoices/inv-1',
        expect.anything(),
      );
      expect(result.current.data).toEqual(SAMPLE_INVOICE);
    });

    it('does not fetch when id is empty', () => {
      fetchSpy = mockFetchSuccess(null);
      const { result } = renderHook(() => useInvoice(''), { wrapper: createWrapper() });
      expect(result.current.isFetching).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('useCreateInvoice', () => {
    it('posts to /api/invoices', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_INVOICE);
      const { result } = renderHook(() => useCreateInvoice(), { wrapper: createWrapper() });
      result.current.mutate({
        contactId: 'c1',
        date: '2024-01-15',
        dueDate: '2024-02-14',
        lineItems: [],
      } as never);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/invoices',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('useUpdateInvoice', () => {
    it('puts to /api/invoices/:id', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_INVOICE);
      const { result } = renderHook(() => useUpdateInvoice(), { wrapper: createWrapper() });
      result.current.mutate({ id: 'inv-1', data: { contactId: 'c2' } as never });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/invoices/inv-1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('useTransitionInvoice', () => {
    it('puts to /api/invoices/:id/status', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_INVOICE);
      const { result } = renderHook(() => useTransitionInvoice(), { wrapper: createWrapper() });
      result.current.mutate({ id: 'inv-1', status: 'submitted' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/invoices/inv-1/status',
        expect.objectContaining({ method: 'PUT' }),
      );
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body.status).toBe('submitted');
    });
  });

  describe('useRecordPayment', () => {
    it('posts to /api/payments', async () => {
      fetchSpy = mockFetchSuccess({ id: 'pay-1' });
      const { result } = renderHook(() => useRecordPayment(), { wrapper: createWrapper() });
      result.current.mutate({
        invoiceId: 'inv-1',
        amount: 500,
        date: '2024-03-01',
        reference: 'CHK-001',
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/payments',
        expect.objectContaining({ method: 'POST' }),
      );
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body.invoiceId).toBe('inv-1');
      expect(body.amount).toBe(500);
    });
  });
});
