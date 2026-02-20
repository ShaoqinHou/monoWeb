// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import {
  useExpenses,
  useExpense,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useApproveExpense,
  useRejectExpense,
  useReimburseExpense,
  useTransitionExpenseStatus,
} from '../hooks/useExpenses';

const MOCK_EXPENSES = [
  {
    id: 'exp-1',
    employeeId: null,
    contactId: null,
    date: '2024-03-01',
    description: 'Office Supplies',
    amount: 120.0,
    taxRate: 15,
    taxAmount: 18.0,
    total: 138.0,
    category: 'Office',
    receiptUrl: null,
    status: 'draft',
    accountCode: '429',
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z',
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

describe('useExpenses hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('useExpenses', () => {
    it('fetches expense list from /api/expenses', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES);

      const { result } = renderHook(() => useExpenses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data).toHaveLength(1);
    });
  });

  describe('useExpense', () => {
    it('fetches a single expense by id', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useExpense('exp-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data!.description).toBe('Office Supplies');
    });

    it('does not fetch when id is empty', () => {
      globalThis.fetch = mockFetchSuccess(null);

      const { result } = renderHook(() => useExpense(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('useCreateExpense', () => {
    it('posts new expense to /api/expenses', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useCreateExpense(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        date: '2024-03-01',
        description: 'Office Supplies',
        amount: 120.0,
        taxRate: 15,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        }),
      );
    });
  });

  describe('useUpdateExpense', () => {
    it('puts updated expense to /api/expenses/:id', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useUpdateExpense(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'exp-1',
        data: { description: 'Updated Supplies' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        }),
      );
    });
  });

  describe('useDeleteExpense', () => {
    it('deletes expense via DELETE /api/expenses/:id', async () => {
      globalThis.fetch = mockFetchSuccess(undefined);

      const { result } = renderHook(() => useDeleteExpense(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('exp-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('useApproveExpense', () => {
    it('approves expense via PUT /api/expenses/:id/approve', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useApproveExpense(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('exp-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1/approve',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('useRejectExpense', () => {
    it('rejects expense via PUT /api/expenses/:id/reject', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useRejectExpense(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('exp-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1/reject',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('useReimburseExpense', () => {
    it('reimburses expense via PUT /api/expenses/:id/reimburse', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useReimburseExpense(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('exp-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1/reimburse',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('useTransitionExpenseStatus', () => {
    it('transitions expense status via PUT /api/expenses/:id/status', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_EXPENSES[0]);

      const { result } = renderHook(() => useTransitionExpenseStatus(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'exp-1', status: 'submitted' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/expenses/exp-1/status',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"status":"submitted"'),
        }),
      );
    });
  });
});
