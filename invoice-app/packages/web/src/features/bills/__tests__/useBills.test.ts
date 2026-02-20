import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBills, useBill, useSuppliers } from '../hooks/useBills';
import type { Bill } from '../types';
import type { ReactNode } from 'react';
import { createElement } from 'react';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockSuccess(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, data }),
  });
}

function mockError(error: string, status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: async () => ({ ok: false, error }),
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const SAMPLE_BILL: Bill = {
  id: 'b001',
  billNumber: 'BILL-0001',
  reference: '',
  contactId: 'c001',
  contactName: 'Test Supplier',
  status: 'draft',
  amountType: 'exclusive',
  currency: 'NZD',
  date: '2024-06-01',
  dueDate: '2024-07-01',
  lineItems: [],
  subTotal: 100,
  totalTax: 15,
  total: 115,
  amountDue: 115,
  amountPaid: 0,
  createdAt: '2024-06-01T00:00:00.000Z',
  updatedAt: '2024-06-01T00:00:00.000Z',
};

describe('useBills', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches bills list from GET /api/bills', async () => {
    mockSuccess([SAMPLE_BILL]);
    const { result } = renderHook(() => useBills(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([SAMPLE_BILL]);
    expect(mockFetch).toHaveBeenCalledWith('/api/bills', expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('handles API error for bills list', async () => {
    mockError('Server error');
    const { result } = renderHook(() => useBills(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useBill', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches single bill from GET /api/bills/:id', async () => {
    mockSuccess(SAMPLE_BILL);
    const { result } = renderHook(() => useBill('b001'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(SAMPLE_BILL);
    expect(mockFetch).toHaveBeenCalledWith('/api/bills/b001', expect.any(Object));
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useBill(''), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useSuppliers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches contacts and filters to suppliers', async () => {
    mockSuccess([
      { id: 'c1', name: 'Supplier A', type: 'supplier', outstandingBalance: 0, overdueBalance: 0, isArchived: false, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'c2', name: 'Customer B', type: 'customer', outstandingBalance: 0, overdueBalance: 0, isArchived: false, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      { id: 'c3', name: 'Both C', type: 'customer_and_supplier', outstandingBalance: 0, overdueBalance: 0, isArchived: false, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    ]);
    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { id: 'c1', name: 'Supplier A' },
      { id: 'c3', name: 'Both C' },
    ]);
    expect(mockFetch).toHaveBeenCalledWith('/api/contacts', expect.any(Object));
  });
});
