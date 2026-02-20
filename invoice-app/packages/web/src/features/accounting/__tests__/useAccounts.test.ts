// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useAccounts, useAccountGroups, useBankAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '../hooks/useAccounts';

const MOCK_API_ACCOUNTS = [
  { id: '1', code: '4-0000', name: 'Sales', type: 'revenue', taxType: 'output', isArchived: false },
  { id: '2', code: '6-0100', name: 'Advertising', type: 'expense', taxType: 'input', isArchived: false },
  { id: '3', code: '1-0000', name: 'Bank Account', type: 'asset', taxType: 'none', isArchived: false },
  { id: '4', code: '2-0000', name: 'Accounts Payable', type: 'liability', taxType: 'none', isArchived: false },
  { id: '5', code: '3-0000', name: 'Retained Earnings', type: 'equity', taxType: 'none', isArchived: false },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

describe('useAccounts', () => {
  it('fetches accounts from /api/accounts', async () => {
    mockFetchOk(MOCK_API_ACCOUNTS);

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/accounts', expect.objectContaining({
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
    expect(result.current.data).toHaveLength(5);
    expect(result.current.data![0].balance).toBe(0);
    expect(result.current.data![0].name).toBe('Sales');
  });
});

describe('useAccountGroups', () => {
  it('fetches accounts and groups them by type', async () => {
    mockFetchOk(MOCK_API_ACCOUNTS);

    const { result } = renderHook(() => useAccountGroups(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const groups = result.current.data!;
    expect(groups).toHaveLength(5);
    expect(groups[0].type).toBe('revenue');
    expect(groups[0].accounts).toHaveLength(1);
    expect(groups[1].type).toBe('expense');
  });
});

describe('useBankAccounts', () => {
  it('fetches accounts and filters for asset type', async () => {
    mockFetchOk(MOCK_API_ACCOUNTS);

    const { result } = renderHook(() => useBankAccounts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Bank Account');
  });
});

describe('useCreateAccount', () => {
  it('sends POST to /api/accounts', async () => {
    const created = { id: 'new-1', code: '4-0200', name: 'New Account', type: 'revenue', taxType: 'none', isArchived: false };
    mockFetchOk(created);

    const { result } = renderHook(() => useCreateAccount(), { wrapper: createWrapper() });

    result.current.mutate({ code: '4-0200', name: 'New Account', type: 'revenue', taxType: 'none', isArchived: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/accounts', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ code: '4-0200', name: 'New Account', type: 'revenue', taxType: 'none', isArchived: false }),
    }));
  });
});

describe('useUpdateAccount', () => {
  it('sends PUT to /api/accounts/:id', async () => {
    const updated = { id: '1', code: '4-0000', name: 'Updated Sales', type: 'revenue', taxType: 'output', isArchived: false };
    mockFetchOk(updated);

    const { result } = renderHook(() => useUpdateAccount(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1', data: { name: 'Updated Sales' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/accounts/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Sales' }),
    }));
  });
});

describe('useDeleteAccount', () => {
  it('sends DELETE to /api/accounts/:id', async () => {
    mockFetchOk({ id: '1' });

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/accounts/1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
