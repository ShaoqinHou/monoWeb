// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useMatchSuggestionsApi,
  useReconcileTransaction,
  useMatchSuggestions,
} from '../hooks/useBank';
import { MatchSuggestion } from '../components/MatchSuggestion';
import type { MatchSuggestionData } from '../types';

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

describe('useMatchSuggestionsApi', () => {
  it('fetches match suggestions from /api/bank-transactions/match-suggestions', async () => {
    const suggestions: MatchSuggestionData[] = [
      { type: 'invoice', id: 'inv-1', reference: 'INV-001', contact: 'Acme', amount: 1500, confidence: 1 },
    ];
    mockFetchOk(suggestions);

    const { result } = renderHook(() => useMatchSuggestionsApi(1500, '2026-01-15'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/bank-transactions/match-suggestions?amount=1500'),
      expect.any(Object),
    );
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].type).toBe('invoice');
    expect(result.current.data![0].reference).toBe('INV-001');
  });

  it('does not fetch when amount is 0', () => {
    renderHook(() => useMatchSuggestionsApi(0, '2026-01-15'), {
      wrapper: createWrapper(),
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not fetch when amount is undefined', () => {
    renderHook(() => useMatchSuggestionsApi(undefined, '2026-01-15'), {
      wrapper: createWrapper(),
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('useReconcileTransaction', () => {
  it('sends PUT to /api/bank-transactions/:id/reconcile with invoice match', async () => {
    mockFetchOk({ id: 'tx-1', isReconciled: true, matchedInvoiceId: 'inv-1' });

    const { result } = renderHook(() => useReconcileTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      transactionId: 'tx-1',
      matchType: 'invoice',
      matchId: 'inv-1',
      matchReference: 'INV-001',
      amount: 1500,
      date: '2026-01-15',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/bank-transactions/tx-1/reconcile',
      expect.objectContaining({
        method: 'PUT',
      }),
    );

    // Verify the body contains the invoice match
    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.invoiceId).toBe('inv-1');
  });

  it('sends PUT with bill match when matchType is bill', async () => {
    mockFetchOk({ id: 'tx-2', isReconciled: true, matchedBillId: 'bill-1' });

    const { result } = renderHook(() => useReconcileTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      transactionId: 'tx-2',
      matchType: 'bill',
      matchId: 'bill-1',
      matchReference: 'BILL-001',
      amount: 500,
      date: '2026-01-15',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.billId).toBe('bill-1');
  });
});

describe('MatchSuggestion component', () => {
  it('renders suggestion info and triggers match callback on click', () => {
    const suggestion: MatchSuggestionData = {
      type: 'invoice',
      id: 'inv-1',
      reference: 'INV-001',
      contact: 'Acme Corp',
      amount: 1500,
      confidence: 0.95,
    };
    const onMatch = vi.fn();

    render(
      createElement(MatchSuggestion, { suggestion, onMatch, isMatching: false }),
    );

    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('95% match')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('match-btn-inv-1'));
    expect(onMatch).toHaveBeenCalledWith(suggestion);
  });

  it('shows loading state when isMatching is true', () => {
    const suggestion: MatchSuggestionData = {
      type: 'bill',
      id: 'bill-1',
      reference: 'BILL-001',
      contact: 'Supplier Co',
      amount: 500,
      confidence: 1,
    };

    render(
      createElement(MatchSuggestion, { suggestion, onMatch: vi.fn(), isMatching: true }),
    );

    expect(screen.getByText('BILL-001')).toBeInTheDocument();
    expect(screen.getByText('100% match')).toBeInTheDocument();
  });
});
