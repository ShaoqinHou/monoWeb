// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useAuditEntries, useAuditEntry } from '../hooks/useAudit';

const MOCK_ENTRIES = [
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    entityType: 'invoice',
    entityId: 'inv-001',
    action: 'created',
    userId: 'user-1',
    userName: 'Demo User',
    timestamp: '2026-02-16T10:00:00.000Z',
    changes: [],
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    entityType: 'contact',
    entityId: 'c-001',
    action: 'updated',
    userId: 'user-1',
    userName: 'Demo User',
    timestamp: '2026-02-15T09:00:00.000Z',
    changes: [{ field: 'name', oldValue: 'Old', newValue: 'New' }],
  },
];

function mockFetchSuccess(data: unknown, total?: number) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data, total: total ?? (Array.isArray(data) ? data.length : 1) }),
  } as Response);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useAudit hooks', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('useAuditEntries', () => {
    it('fetches audit entries from /api/audit', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_ENTRIES);

      const { result } = renderHook(() => useAuditEntries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/audit',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data?.entries).toHaveLength(2);
    });

    it('passes entityType filter as query param', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_ENTRIES.filter(e => e.entityType === 'invoice'));

      const { result } = renderHook(
        () => useAuditEntries({ entityType: 'invoice' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/audit?entityType=invoice',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('passes action filter as query param', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_ENTRIES.filter(e => e.action === 'created'));

      const { result } = renderHook(
        () => useAuditEntries({ action: 'created' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/audit?action=created',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('passes date range filters', async () => {
      globalThis.fetch = mockFetchSuccess([]);

      const { result } = renderHook(
        () => useAuditEntries({ startDate: '2026-02-01', endDate: '2026-02-28' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/audit?startDate=2026-02-01&endDate=2026-02-28',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('passes multiple filters as query params', async () => {
      globalThis.fetch = mockFetchSuccess([]);

      const { result } = renderHook(
        () => useAuditEntries({ entityType: 'invoice', action: 'created' }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/audit?entityType=invoice&action=created',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });
  });

  describe('useAuditEntry', () => {
    it('fetches a single audit entry by id', async () => {
      globalThis.fetch = mockFetchSuccess(MOCK_ENTRIES[0]);

      const { result } = renderHook(
        () => useAuditEntry('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/audit/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(result.current.data?.entityType).toBe('invoice');
    });

    it('does not fetch when id is empty', () => {
      globalThis.fetch = mockFetchSuccess(null);

      const { result } = renderHook(() => useAuditEntry(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
});
