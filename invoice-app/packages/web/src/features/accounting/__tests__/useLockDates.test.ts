// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useLockDates, useUpdateLockDates } from '../hooks/useLockDates';

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

describe('useLockDates', () => {
  it('fetches lock dates from /api/settings/lock-dates', async () => {
    mockFetchOk({ lockDate: '2025-12-31', advisorLockDate: '2025-06-30' });

    const { result } = renderHook(() => useLockDates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/settings/lock-dates',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data!.lockDate).toBe('2025-12-31');
    expect(result.current.data!.advisorLockDate).toBe('2025-06-30');
  });

  it('handles null lock dates', async () => {
    mockFetchOk({ lockDate: null, advisorLockDate: null });

    const { result } = renderHook(() => useLockDates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.lockDate).toBeNull();
    expect(result.current.data!.advisorLockDate).toBeNull();
  });

  it('returns error when API fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Not found' }),
    });

    const { result } = renderHook(() => useLockDates(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useUpdateLockDates', () => {
  it('sends PUT to /api/settings/lock-dates', async () => {
    mockFetchOk({ lockDate: '2026-01-31', advisorLockDate: '2025-12-31' });

    const { result } = renderHook(() => useUpdateLockDates(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ lockDate: '2026-01-31', advisorLockDate: '2025-12-31' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/settings/lock-dates',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ lockDate: '2026-01-31', advisorLockDate: '2025-12-31' }),
      }),
    );
  });

  it('can clear lock dates by sending nulls', async () => {
    mockFetchOk({ lockDate: null, advisorLockDate: null });

    const { result } = renderHook(() => useUpdateLockDates(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ lockDate: null, advisorLockDate: null });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/settings/lock-dates',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ lockDate: null, advisorLockDate: null }),
      }),
    );
  });
});
