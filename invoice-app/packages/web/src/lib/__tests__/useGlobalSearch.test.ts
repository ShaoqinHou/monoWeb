// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock apiFetch before importing the hook
vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
}));

import { useGlobalSearch } from '../useGlobalSearch';
import { apiFetch } from '../api-helpers';

const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

// Helper to advance fake timers and flush microtasks
async function advanceTimersAndFlush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  // Extra flush for promise resolution
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockApiFetch.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty results initially', () => {
    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.query).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('returns empty results for queries shorter than 2 characters', async () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.setQuery('a');
    });
    await advanceTimersAndFlush(300);
    expect(result.current.results).toEqual([]);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('debounces search - does not fetch immediately', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.setQuery('Acme');
    });
    // Before debounce fires - should not have called apiFetch yet
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('fetches from multiple endpoints after debounce', async () => {
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('Acme');
    });

    await advanceTimersAndFlush(250);

    // Should call contacts, invoices, and bills endpoints
    const calls = mockApiFetch.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContainEqual(expect.stringContaining('/contacts'));
    expect(calls).toContainEqual(expect.stringContaining('/invoices'));
    expect(calls).toContainEqual(expect.stringContaining('/bills'));
  });

  it('returns merged results sorted by type', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/contacts')) {
        return Promise.resolve([
          { id: 'c1', name: 'Acme Corp', type: 'customer' },
        ]);
      }
      if (path.includes('/invoices')) {
        return Promise.resolve([
          { id: 'i1', number: 'INV-0001', total: 1500, status: 'draft' },
        ]);
      }
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('Acme');
    });

    await advanceTimersAndFlush(250);

    // Results should have proper SearchResult shape
    const contactResult = result.current.results.find(r => r.type === 'contact');
    expect(contactResult).toMatchObject({ title: 'Acme Corp', href: expect.stringContaining('/contacts/') });

    const invoiceResult = result.current.results.find(r => r.type === 'invoice');
    expect(invoiceResult).toMatchObject({ title: 'INV-0001', href: expect.stringContaining('/invoices/') });
  });

  it('stores recent searches in localStorage', async () => {
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('Acme');
    });

    await advanceTimersAndFlush(250);

    const stored = localStorage.getItem('xero-recent-searches');
    expect(stored).toEqual(expect.any(String));
    const parsed = JSON.parse(stored!);
    expect(parsed).toContain('Acme');
  });

  it('limits recent searches to 5 entries', async () => {
    // Pre-fill localStorage with 5 entries
    localStorage.setItem(
      'xero-recent-searches',
      JSON.stringify(['one', 'two', 'three', 'four', 'five']),
    );
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('six');
    });

    await advanceTimersAndFlush(250);

    const stored = JSON.parse(localStorage.getItem('xero-recent-searches')!);
    expect(stored.length).toBe(5);
    expect(stored[0]).toBe('six');
    expect(stored).not.toContain('five');
  });

  it('returns recent searches from localStorage', () => {
    localStorage.setItem(
      'xero-recent-searches',
      JSON.stringify(['alpha', 'beta']),
    );

    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.recentSearches).toEqual(['alpha', 'beta']);
  });

  it('clearRecent removes all recent searches from localStorage', () => {
    localStorage.setItem(
      'xero-recent-searches',
      JSON.stringify(['alpha', 'beta']),
    );

    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.clearRecent();
    });

    expect(result.current.recentSearches).toEqual([]);
    expect(localStorage.getItem('xero-recent-searches')).toBe('[]');
  });

  it('does not add duplicate recent searches', async () => {
    localStorage.setItem(
      'xero-recent-searches',
      JSON.stringify(['Acme']),
    );
    mockApiFetch.mockResolvedValue([]);

    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('Acme');
    });

    await advanceTimersAndFlush(250);

    const stored = JSON.parse(localStorage.getItem('xero-recent-searches')!);
    const acmeCount = stored.filter((s: string) => s === 'Acme').length;
    expect(acmeCount).toBe(1);
  });

  it('sets isLoading true while fetching', async () => {
    let resolvePromise: (v: unknown[]) => void;
    const pending = new Promise<unknown[]>((res) => {
      resolvePromise = res;
    });

    mockApiFetch.mockImplementation(() => pending);

    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery('test');
    });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    // isLoading should be true while promises are pending
    expect(result.current.isLoading).toBe(true);

    // Resolve all API calls
    await act(async () => {
      resolvePromise!([]);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
