// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useArchiveContact, useUnarchiveContact } from '../hooks/useContacts';

let originalFetch: typeof globalThis.fetch;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('useArchiveContact', () => {
  it('calls PUT /api/contacts/:id with isArchived: true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { id: 'c1', isArchived: true } }),
    } as Response);
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useArchiveContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('c1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contacts/c1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ isArchived: true }),
      }),
    );
  });
});

describe('useUnarchiveContact', () => {
  it('calls PUT /api/contacts/:id with isArchived: false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { id: 'c1', isArchived: false } }),
    } as Response);
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useUnarchiveContact(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('c1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contacts/c1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ isArchived: false }),
      }),
    );
  });
});
