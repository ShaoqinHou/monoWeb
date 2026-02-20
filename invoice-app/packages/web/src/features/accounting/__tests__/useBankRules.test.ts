// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useBankRules,
  useBankRule,
  useCreateBankRule,
  useUpdateBankRule,
  useDeleteBankRule,
} from '../hooks/useBankRules';

const MOCK_RULES = [
  {
    id: 'r1',
    name: 'Office Rent',
    accountId: 'acc-1',
    matchField: 'description',
    matchType: 'contains',
    matchValue: 'Rent Payment',
    allocateToAccountCode: '469',
    taxRate: 15,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'r2',
    name: 'Bank Fees',
    accountId: 'acc-1',
    matchField: 'description',
    matchType: 'equals',
    matchValue: 'Monthly Fee',
    allocateToAccountCode: '404',
    taxRate: 0,
    isActive: true,
    createdAt: '2024-02-01T00:00:00.000Z',
  },
];

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

describe('useBankRules', () => {
  it('fetches bank rules from /api/bank-rules', async () => {
    mockFetchOk(MOCK_RULES);

    const { result } = renderHook(() => useBankRules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-rules',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].name).toBe('Office Rent');
  });
});

describe('useBankRule', () => {
  it('fetches a single bank rule by id', async () => {
    mockFetchOk(MOCK_RULES[0]);

    const { result } = renderHook(() => useBankRule('r1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-rules/r1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data!.name).toBe('Office Rent');
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useBankRule(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateBankRule', () => {
  it('sends POST to /api/bank-rules', async () => {
    const created = { ...MOCK_RULES[0], id: 'r-new' };
    mockFetchOk(created);

    const { result } = renderHook(() => useCreateBankRule(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        name: 'Office Rent',
        accountId: 'acc-1',
        matchValue: 'Rent Payment',
        allocateToAccountCode: '469',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-rules',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Office Rent',
          accountId: 'acc-1',
          matchValue: 'Rent Payment',
          allocateToAccountCode: '469',
        }),
      }),
    );
  });
});

describe('useUpdateBankRule', () => {
  it('sends PUT to /api/bank-rules/:id', async () => {
    mockFetchOk({ ...MOCK_RULES[0], name: 'Updated Rent' });

    const { result } = renderHook(() => useUpdateBankRule(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ id: 'r1', data: { name: 'Updated Rent' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-rules/r1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Rent' }),
      }),
    );
  });
});

describe('useDeleteBankRule', () => {
  it('sends DELETE to /api/bank-rules/:id', async () => {
    mockFetchOk({ id: 'r1' });

    const { result } = renderHook(() => useDeleteBankRule(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('r1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-rules/r1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
