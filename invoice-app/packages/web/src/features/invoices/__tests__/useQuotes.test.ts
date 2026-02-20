import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useQuotes,
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useTransitionQuote,
  useConvertQuote,
} from '../hooks/useQuotes';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const SAMPLE_QUOTE = {
  id: 'q-1',
  quoteNumber: 'QU-0001',
  contactId: 'c1',
  contactName: 'Test',
  status: 'draft',
  total: 1000,
};

function mockFetchSuccess(data: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data }),
  } as Response);
}

describe('useQuotes hooks -- API wiring', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('useQuotes', () => {
    it('fetches /api/quotes', async () => {
      fetchSpy = mockFetchSuccess([SAMPLE_QUOTE]);
      const { result } = renderHook(() => useQuotes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
      );
      expect(result.current.data).toEqual([SAMPLE_QUOTE]);
    });
  });

  describe('useQuote', () => {
    it('fetches /api/quotes/:id', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_QUOTE);
      const { result } = renderHook(() => useQuote('q-1'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes/q-1',
        expect.anything(),
      );
      expect(result.current.data).toEqual(SAMPLE_QUOTE);
    });

    it('does not fetch when id is empty', () => {
      fetchSpy = mockFetchSuccess(null);
      const { result } = renderHook(() => useQuote(''), { wrapper: createWrapper() });
      expect(result.current.isFetching).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('useCreateQuote', () => {
    it('posts to /api/quotes', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_QUOTE);
      const { result } = renderHook(() => useCreateQuote(), { wrapper: createWrapper() });
      result.current.mutate({
        contactId: 'c1',
        date: '2026-01-15',
        expiryDate: '2026-02-15',
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('useUpdateQuote', () => {
    it('puts to /api/quotes/:id', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_QUOTE);
      const { result } = renderHook(() => useUpdateQuote(), { wrapper: createWrapper() });
      result.current.mutate({ id: 'q-1', data: { reference: 'REF-1' } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes/q-1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('useTransitionQuote', () => {
    it('puts to /api/quotes/:id/status', async () => {
      fetchSpy = mockFetchSuccess(SAMPLE_QUOTE);
      const { result } = renderHook(() => useTransitionQuote(), { wrapper: createWrapper() });
      result.current.mutate({ id: 'q-1', status: 'sent' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes/q-1/status',
        expect.objectContaining({ method: 'PUT' }),
      );
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body.status).toBe('sent');
    });
  });

  describe('useConvertQuote', () => {
    it('posts to /api/quotes/:id/convert', async () => {
      fetchSpy = mockFetchSuccess({ id: 'inv-1' });
      const { result } = renderHook(() => useConvertQuote(), { wrapper: createWrapper() });
      result.current.mutate('q-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/quotes/q-1/convert',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
