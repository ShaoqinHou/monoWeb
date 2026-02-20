// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useAgedReceivables, useAgedPayables } from '../hooks/useReports';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useAgedReceivables', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            buckets: [{ label: 'Current', amount: 5000, count: 3 }],
            total: 5000,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('fetches from /api/reports/aged-receivables', async () => {
    const { result } = renderHook(() => useAgedReceivables(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/reports/aged-receivables');
  });

  it('returns aged report data', async () => {
    const { result } = renderHook(() => useAgedReceivables(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data?.total).toBe(5000);
    expect(result.current.data?.buckets).toHaveLength(1);
    expect(result.current.data?.buckets[0].label).toBe('Current');
  });
});

describe('useAgedPayables', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          data: {
            buckets: [{ label: '1-30 days', amount: 2000, count: 1 }],
            total: 2000,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('fetches from /api/reports/aged-payables', async () => {
    const { result } = renderHook(() => useAgedPayables(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/reports/aged-payables');
  });
});
