// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useStockAdjustment, useStockMovements } from '../hooks/useStockAdjustment';

const MOCK_PRODUCT = {
  id: 'p1',
  code: 'SKU-001',
  name: 'Widget Pro',
  quantityOnHand: 170,
};

const MOCK_MOVEMENTS = [
  {
    id: 'm1',
    productId: 'p1',
    type: 'adjustment',
    quantity: 20,
    reason: 'stock_take',
    notes: 'Annual count',
    referenceId: null,
    createdAt: '2026-02-16T10:00:00.000Z',
  },
  {
    id: 'm2',
    productId: 'p1',
    type: 'invoice',
    quantity: -5,
    reason: null,
    notes: null,
    referenceId: 'inv-1',
    createdAt: '2026-02-15T10:00:00.000Z',
  },
];

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data }),
  } as Response);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useStockAdjustment hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('useStockAdjustment', () => {
    it('posts stock adjustment to /api/products/:id/adjust', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_PRODUCT);

      const { result } = renderHook(() => useStockAdjustment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'p1',
        data: { quantity: 20, reason: 'stock_take', notes: 'Annual count' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products/p1/adjust',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"quantity":20'),
        }),
      );
    });
  });

  describe('useStockMovements', () => {
    it('fetches movements from /api/products/:id/movements', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_MOVEMENTS);

      const { result } = renderHook(() => useStockMovements('p1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products/p1/movements',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data).toHaveLength(2);
    });

    it('does not fetch when productId is empty', () => {
      globalThis.fetch = mockFetchSuccess(null);

      const { result } = renderHook(() => useStockMovements(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});
