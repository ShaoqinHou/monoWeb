// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock api-helpers
const mockApiPost = vi.fn();
vi.mock('../../../../lib/api-helpers', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

import { useImportTransactions } from '../hooks/useImportTransactions';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useImportTransactions', () => {
  beforeEach(() => {
    mockApiPost.mockClear();
  });

  it('calls POST /bank-transactions/import with params', async () => {
    mockApiPost.mockResolvedValue({ imported: 3 });

    const { result } = renderHook(() => useImportTransactions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      accountId: 'acc-1',
      transactions: [
        { date: '2026-02-15', description: 'Payment', amount: 1500 },
        { date: '2026-02-16', description: 'Rent', amount: -2000 },
        { date: '2026-02-17', description: 'Sales', amount: 500 },
      ],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiPost).toHaveBeenCalledWith('/bank-transactions/import', {
      accountId: 'acc-1',
      transactions: [
        { date: '2026-02-15', description: 'Payment', amount: 1500 },
        { date: '2026-02-16', description: 'Rent', amount: -2000 },
        { date: '2026-02-17', description: 'Sales', amount: 500 },
      ],
    });
  });

  it('handles import error', async () => {
    mockApiPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useImportTransactions(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      accountId: 'acc-1',
      transactions: [{ date: '2026-02-15', description: 'Payment', amount: 1500 }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });
});
