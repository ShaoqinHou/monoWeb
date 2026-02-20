// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useTrackingCategories,
  useTrackingCategory,
  useCreateTrackingCategory,
  useUpdateTrackingCategory,
  useDeleteTrackingCategory,
} from '../hooks/useTrackingCategories';

const MOCK_CATEGORIES = [
  {
    id: 'tc1',
    name: 'Region',
    options: [
      { id: 'o1', name: 'North' },
      { id: 'o2', name: 'South' },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tc2',
    name: 'Department',
    options: [{ id: 'o3', name: 'Engineering' }],
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

describe('useTrackingCategories', () => {
  it('fetches categories from /api/tracking-categories', async () => {
    mockFetchOk(MOCK_CATEGORIES);

    const { result } = renderHook(() => useTrackingCategories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tracking-categories',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].name).toBe('Region');
  });
});

describe('useTrackingCategory', () => {
  it('fetches a single category by id', async () => {
    mockFetchOk(MOCK_CATEGORIES[0]);

    const { result } = renderHook(() => useTrackingCategory('tc1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tracking-categories/tc1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(result.current.data!.name).toBe('Region');
    expect(result.current.data!.options).toHaveLength(2);
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useTrackingCategory(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateTrackingCategory', () => {
  it('sends POST to /api/tracking-categories', async () => {
    mockFetchOk({ id: 'tc-new', name: 'Project', options: [{ id: 'o-new', name: 'Alpha' }], createdAt: '2026-02-16T00:00:00Z' });

    const { result } = renderHook(() => useCreateTrackingCategory(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ name: 'Project', options: ['Alpha'] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tracking-categories',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Project', options: [{ id: '', name: 'Alpha', isActive: true }] }),
      }),
    );
  });
});

describe('useUpdateTrackingCategory', () => {
  it('sends PUT to /api/tracking-categories/:id', async () => {
    mockFetchOk({ ...MOCK_CATEGORIES[0], name: 'Updated Region' });

    const { result } = renderHook(() => useUpdateTrackingCategory(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ id: 'tc1', data: { name: 'Updated Region' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tracking-categories/tc1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Region' }),
      }),
    );
  });
});

describe('useDeleteTrackingCategory', () => {
  it('sends DELETE to /api/tracking-categories/:id', async () => {
    mockFetchOk({ id: 'tc1' });

    const { result } = renderHook(() => useDeleteTrackingCategory(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('tc1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tracking-categories/tc1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
