// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useProfitAndLoss, useBalanceSheet } from '../hooks/useReports';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useReports hooks', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('useProfitAndLoss', () => {
    it('fetches from /api/reports/profit-and-loss with date range', async () => {
      const { result } = renderHook(
        () => useProfitAndLoss({ from: '2026-01-01', to: '2026-06-30' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isFetched).toBe(true));

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toBe('/api/reports/profit-and-loss?start=2026-01-01&end=2026-06-30&basis=accrual');
    });

    it('sends GET request with Content-Type json', async () => {
      const { result } = renderHook(
        () => useProfitAndLoss({ from: '2026-01-01', to: '2026-12-31' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isFetched).toBe(true));

      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('useBalanceSheet', () => {
    it('fetches from /api/reports/balance-sheet with asAt param', async () => {
      const { result } = renderHook(
        () => useBalanceSheet('2026-02-16'),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isFetched).toBe(true));

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const url = fetchSpy.mock.calls[0][0] as string;
      expect(url).toBe('/api/reports/balance-sheet?asAt=2026-02-16');
    });
  });
});
