// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProducts';

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    code: 'SKU-001',
    name: 'Widget Pro',
    description: 'Premium widget',
    purchasePrice: 25.0,
    salePrice: 49.99,
    accountCode: '200',
    taxRate: 15,
    isTracked: true,
    quantityOnHand: 150,
    isSold: true,
    isPurchased: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data }),
  } as Response);
}

function mockFetchError(message: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: false, error: message }),
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

describe('useProducts hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('useProducts', () => {
    it('fetches product list from /api/products', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_PRODUCTS);

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].name).toBe('Widget Pro');
    });

    it('returns empty array when no products exist', async () => {
      globalThis.fetch = mockFetchSuccess([]);

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('useProduct', () => {
    it('fetches a single product by id', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_PRODUCTS[0]);

      const { result } = renderHook(() => useProduct('p1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products/p1',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data!.code).toBe('SKU-001');
    });

    it('does not fetch when id is empty', () => {
      globalThis.fetch = mockFetchSuccess(null);

      const { result } = renderHook(() => useProduct(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('useCreateProduct', () => {
    it('posts new product to /api/products', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_PRODUCTS[0]);

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        code: 'SKU-001',
        name: 'Widget Pro',
        salePrice: 49.99,
        purchasePrice: 25.0,
        taxRate: 15,
        isTracked: true,
        quantityOnHand: 150,
        isSold: true,
        isPurchased: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        }),
      );
    });
  });

  describe('useUpdateProduct', () => {
    it('puts updated product to /api/products/:id', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_PRODUCTS[0]);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'p1',
        data: { name: 'Widget Pro V2' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products/p1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        }),
      );
    });
  });

  describe('useDeleteProduct', () => {
    it('deletes product via DELETE /api/products/:id', async () => {
      globalThis.fetch = mockFetchSuccess(undefined);

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('p1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/products/p1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
