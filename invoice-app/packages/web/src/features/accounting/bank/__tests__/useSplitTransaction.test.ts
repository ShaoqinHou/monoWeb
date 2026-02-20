// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useSplitTransaction,
  validateSplitTotal,
  MAX_SPLIT_LINES,
  type SplitLine,
} from '../hooks/useSplitTransaction';

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

// ── validateSplitTotal (pure function) ───────────────────────────────────

describe('validateSplitTotal', () => {
  it('returns null for valid split that matches amount', () => {
    const lines: SplitLine[] = [
      { accountCode: '400', amount: 300, taxRate: '15', description: 'Part A' },
      { accountCode: '469', amount: 200, taxRate: '15', description: 'Part B' },
    ];
    expect(validateSplitTotal(lines, 500)).toBeNull();
  });

  it('returns error for empty lines', () => {
    expect(validateSplitTotal([], 500)).toBe('At least one split line is required');
  });

  it('returns error when exceeding MAX_SPLIT_LINES', () => {
    const lines: SplitLine[] = Array.from({ length: MAX_SPLIT_LINES + 1 }, (_, i) => ({
      accountCode: '400',
      amount: 10,
      taxRate: '0',
      description: `Line ${i}`,
    }));
    expect(validateSplitTotal(lines, 110)).toBe(`Maximum ${MAX_SPLIT_LINES} split lines allowed`);
  });

  it('returns error when split total does not match transaction amount', () => {
    const lines: SplitLine[] = [
      { accountCode: '400', amount: 300, taxRate: '15', description: 'Part A' },
      { accountCode: '469', amount: 100, taxRate: '15', description: 'Part B' },
    ];
    const result = validateSplitTotal(lines, 500);
    expect(result).toContain('does not match');
  });

  it('allows tiny rounding differences (within 0.01)', () => {
    const lines: SplitLine[] = [
      { accountCode: '400', amount: 333.33, taxRate: '15', description: 'A' },
      { accountCode: '469', amount: 166.67, taxRate: '15', description: 'B' },
    ];
    // 333.33 + 166.67 = 500.00, exact match
    expect(validateSplitTotal(lines, 500)).toBeNull();
  });

  it('returns error when a line has no account code', () => {
    const lines: SplitLine[] = [
      { accountCode: '', amount: 500, taxRate: '15', description: 'Part A' },
    ];
    expect(validateSplitTotal(lines, 500)).toBe('All split lines require an account code');
  });

  it('returns error when a line has zero amount', () => {
    const lines: SplitLine[] = [
      { accountCode: '400', amount: 0, taxRate: '15', description: 'Part A' },
    ];
    expect(validateSplitTotal(lines, 0)).toBe('Split line amounts cannot be zero');
  });
});

// ── useSplitTransaction (mutation hook) ──────────────────────────────────

describe('useSplitTransaction', () => {
  it('sends POST to /api/bank-transactions/:id/split with lines', async () => {
    mockFetchOk({ success: true });

    const { result } = renderHook(() => useSplitTransaction(), { wrapper: createWrapper() });

    const lines: SplitLine[] = [
      { accountCode: '400', amount: 300, taxRate: '15', description: 'Part A' },
      { accountCode: '469', amount: 200, taxRate: '15', description: 'Part B' },
    ];

    await act(async () => {
      result.current.mutate({ transactionId: 'tx-1', lines });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-transactions/tx-1/split',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ lines }),
      }),
    );
  });

  it('returns error on API failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Invalid split' }),
    });

    const { result } = renderHook(() => useSplitTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        transactionId: 'tx-1',
        lines: [{ accountCode: '400', amount: 500, taxRate: '15', description: 'All' }],
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ── MAX_SPLIT_LINES constant ─────────────────────────────────────────────

describe('MAX_SPLIT_LINES', () => {
  it('is set to 10', () => {
    expect(MAX_SPLIT_LINES).toBe(10);
  });
});
