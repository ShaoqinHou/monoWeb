// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useFixedAssets,
  useFixedAsset,
  useCreateFixedAsset,
  useUpdateFixedAsset,
  useDeleteFixedAsset,
  useDepreciateAsset,
  useDisposeAsset,
} from '../hooks/useFixedAssets';

const MOCK_ASSET = {
  id: 'a1',
  name: 'Office Laptop',
  assetNumber: 'FA-001',
  purchaseDate: '2024-01-15',
  purchasePrice: 2400,
  depreciationMethod: 'straight_line',
  depreciationRate: 20,
  currentValue: 2000,
  accumulatedDepreciation: 400,
  assetAccountCode: '1-1200',
  depreciationAccountCode: '6-0800',
  status: 'registered',
  disposalDate: null,
  disposalPrice: null,
  createdAt: '2024-01-15T00:00:00.000Z',
};

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

describe('useFixedAssets', () => {
  it('fetches assets from /api/fixed-assets', async () => {
    mockFetchOk([MOCK_ASSET]);

    const { result } = renderHook(() => useFixedAssets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe('Office Laptop');
  });
});

describe('useFixedAsset', () => {
  it('fetches a single asset by id', async () => {
    mockFetchOk(MOCK_ASSET);

    const { result } = renderHook(() => useFixedAsset('a1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/a1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data!.assetNumber).toBe('FA-001');
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useFixedAsset(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateFixedAsset', () => {
  it('sends POST to /api/fixed-assets', async () => {
    const created = { ...MOCK_ASSET, id: 'a-new' };
    mockFetchOk(created);

    const { result } = renderHook(() => useCreateFixedAsset(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        name: 'Office Laptop',
        purchaseDate: '2024-01-15',
        purchasePrice: 2400,
        assetAccountCode: '1-1200',
        depreciationAccountCode: '6-0800',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Office Laptop',
          purchaseDate: '2024-01-15',
          purchasePrice: 2400,
          assetAccountCode: '1-1200',
          depreciationAccountCode: '6-0800',
        }),
      }),
    );
  });
});

describe('useUpdateFixedAsset', () => {
  it('sends PUT to /api/fixed-assets/:id', async () => {
    mockFetchOk({ ...MOCK_ASSET, name: 'Updated Laptop' });

    const { result } = renderHook(() => useUpdateFixedAsset(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ id: 'a1', data: { name: 'Updated Laptop' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/a1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Laptop' }),
      }),
    );
  });
});

describe('useDeleteFixedAsset', () => {
  it('sends DELETE to /api/fixed-assets/:id', async () => {
    mockFetchOk({ id: 'a1' });

    const { result } = renderHook(() => useDeleteFixedAsset(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/a1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('useDepreciateAsset', () => {
  it('sends POST to /api/fixed-assets/:id/depreciate', async () => {
    mockFetchOk({ ...MOCK_ASSET, currentValue: 1960, accumulatedDepreciation: 440 });

    const { result } = renderHook(() => useDepreciateAsset(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('a1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/a1/depreciate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
  });
});

describe('useDisposeAsset', () => {
  it('sends POST to /api/fixed-assets/:id/dispose with type and price', async () => {
    mockFetchOk({ ...MOCK_ASSET, status: 'sold', disposalDate: '2026-02-16', disposalPrice: 1500 });

    const { result } = renderHook(() => useDisposeAsset(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ id: 'a1', type: 'sold', price: 1500 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/a1/dispose',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'sold', price: 1500 }),
      }),
    );
  });

  it('sends dispose without price for disposed type', async () => {
    mockFetchOk({ ...MOCK_ASSET, status: 'disposed' });

    const { result } = renderHook(() => useDisposeAsset(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ id: 'a1', type: 'disposed' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/fixed-assets/a1/dispose',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'disposed' }),
      }),
    );
  });
});
