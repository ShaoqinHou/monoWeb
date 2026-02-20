// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useBulkReconcile } from '../hooks/useBulkReconcile';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

describe('useBulkReconcile', () => {
  it('sends POST to /api/bank-transactions/bulk-reconcile with transaction IDs', async () => {
    mockFetchOk({ reconciled: 3, failed: 0 });

    const { result } = renderHook(() => useBulkReconcile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(['tx-1', 'tx-2', 'tx-3']);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-transactions/bulk-reconcile',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ transactionIds: ['tx-1', 'tx-2', 'tx-3'] }),
      }),
    );

    expect(result.current.data).toEqual({ reconciled: 3, failed: 0 });
  });

  it('handles partial failures', async () => {
    mockFetchOk({ reconciled: 2, failed: 1 });

    const { result } = renderHook(() => useBulkReconcile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(['tx-1', 'tx-2', 'tx-3']);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.reconciled).toBe(2);
    expect(result.current.data!.failed).toBe(1);
  });

  it('returns error on API failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Server error' }),
    });

    const { result } = renderHook(() => useBulkReconcile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(['tx-1']);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('sends empty array without error', async () => {
    mockFetchOk({ reconciled: 0, failed: 0 });

    const { result } = renderHook(() => useBulkReconcile(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate([]);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.reconciled).toBe(0);
  });
});
