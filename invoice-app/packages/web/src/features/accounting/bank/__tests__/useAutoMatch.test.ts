// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAutoMatchSuggestions, useApplyAutoMatch } from '../hooks/useAutoMatch';

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

describe('useAutoMatchSuggestions', () => {
  it('fetches auto-match suggestions for a transaction', async () => {
    const suggestions = [
      { ruleId: 'r1', ruleName: 'Office Rent', accountCode: '469', confidence: 0.95, matchedField: 'description' },
      { ruleId: 'r2', ruleName: 'Bank Fees', accountCode: '404', confidence: 0.80, matchedField: 'description' },
    ];
    mockFetchOk(suggestions);

    const { result } = renderHook(() => useAutoMatchSuggestions('tx-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-transactions/tx-1/auto-match',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].ruleName).toBe('Office Rent');
  });

  it('does not fetch when transactionId is empty', () => {
    const { result } = renderHook(() => useAutoMatchSuggestions(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns error when API fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Not found' }),
    });

    const { result } = renderHook(() => useAutoMatchSuggestions('tx-missing'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useApplyAutoMatch', () => {
  it('sends POST to /api/bank-transactions/:id/apply-rule', async () => {
    mockFetchOk({ success: true });

    const { result } = renderHook(() => useApplyAutoMatch(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ transactionId: 'tx-1', ruleId: 'r1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-transactions/tx-1/apply-rule',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ruleId: 'r1' }),
      }),
    );
  });

  it('returns error on failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Rule not found' }),
    });

    const { result } = renderHook(() => useApplyAutoMatch(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ transactionId: 'tx-1', ruleId: 'r-invalid' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
