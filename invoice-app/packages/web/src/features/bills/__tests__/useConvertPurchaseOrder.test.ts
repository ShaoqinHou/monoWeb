// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useConvertPurchaseOrderToBill } from '../hooks/useConvertPurchaseOrder';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function mockFetchSuccess(data: unknown) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data }),
  } as Response);
}

describe('useConvertPurchaseOrderToBill', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('posts to /api/purchase-orders/:id/convert', async () => {
    fetchSpy = mockFetchSuccess({ id: 'bill-1', sourcePurchaseOrderId: 'po-1' });
    const { result } = renderHook(() => useConvertPurchaseOrderToBill(), { wrapper: createWrapper() });
    result.current.mutate('po-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/purchase-orders/po-1/convert',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
