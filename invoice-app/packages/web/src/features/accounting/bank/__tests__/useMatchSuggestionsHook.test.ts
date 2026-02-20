// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useMatchSuggestions } from '../hooks/useMatchSuggestions';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchOk(data: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, data }),
  });
}

describe('useMatchSuggestions', () => {
  it('fetches match suggestions from /api/bank-transactions/:id/suggestions', async () => {
    const suggestions = [
      { type: 'invoice', id: 'inv-1', reference: 'INV-001', amount: 1500, contact: 'Client A', confidence: 0.95 },
      { type: 'bill', id: 'bill-1', reference: 'BILL-001', amount: 500, contact: 'Vendor A', confidence: 0.88 },
    ];
    mockFetchOk(suggestions);

    const { result } = renderHook(() => useMatchSuggestions('tx-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-transactions/tx-1/suggestions',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].type).toBe('invoice');
    expect(result.current.data![0].confidence).toBe(0.95);
  });

  it('does not fetch when transactionId is empty', () => {
    const { result } = renderHook(() => useMatchSuggestions(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns error when API fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Transaction not found' }),
    });

    const { result } = renderHook(() => useMatchSuggestions('tx-missing'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('returns empty array from API', async () => {
    mockFetchOk([]);

    const { result } = renderHook(() => useMatchSuggestions('tx-no-match'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });
});
