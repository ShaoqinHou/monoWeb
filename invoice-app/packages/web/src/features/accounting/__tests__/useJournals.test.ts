// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useJournals, useCreateJournal } from '../hooks/useJournals';

const MOCK_JOURNALS = [
  {
    id: 'j-1',
    date: '2024-01-15',
    narration: 'Monthly depreciation',
    status: 'posted',
    lines: [
      { id: 'jl-1', accountId: '4', accountName: 'Advertising', description: 'Depreciation charge', debit: 500, credit: 0 },
      { id: 'jl-2', accountId: '10', accountName: 'Equipment', description: 'Accumulated depreciation', debit: 0, credit: 500 },
    ],
  },
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

describe('useJournals', () => {
  it('fetches journals from /api/journals', async () => {
    mockFetchOk(MOCK_JOURNALS);

    const { result } = renderHook(() => useJournals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/journals', expect.objectContaining({
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].narration).toBe('Monthly depreciation');
  });
});

describe('useCreateJournal', () => {
  it('sends POST to /api/journals', async () => {
    const newJournal = {
      id: 'j-new',
      date: '2024-03-01',
      narration: 'Test journal',
      status: 'draft' as const,
      lines: [
        { id: 'jl-a', accountId: '1', accountName: 'Sales', description: 'Debit', debit: 100, credit: 0 },
        { id: 'jl-b', accountId: '3', accountName: 'Bank Account', description: 'Credit', debit: 0, credit: 100 },
      ],
    };
    mockFetchOk(newJournal);

    const { result } = renderHook(() => useCreateJournal(), { wrapper: createWrapper() });

    const input = {
      date: '2024-03-01',
      narration: 'Test journal',
      status: 'draft' as const,
      lines: [
        { id: 'jl-a', accountId: '1', accountName: 'Sales', description: 'Debit', debit: 100, credit: 0 },
        { id: 'jl-b', accountId: '3', accountName: 'Bank Account', description: 'Credit', debit: 0, credit: 100 },
      ],
    };

    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith('/api/journals', expect.objectContaining({
      method: 'POST',
    }));

    // Verify request body
    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.narration).toBe('Test journal');
    expect(body.lines).toHaveLength(2);
  });
});
